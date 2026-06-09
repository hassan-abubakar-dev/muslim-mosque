import cloudinary from "../config/claudinary.js";
import dbConnection from "../config/db.js";
import AppError from "../utils/AppError.js";
import dotenv from 'dotenv';
import { Op } from "sequelize";
import {Category, CategoryProfile, Lecture} from '../models/relationship.js'
import { deleteFileFromR2 } from "../utils/r2.js"; 
import performCategoryCleanup from "../service/category.js";


dotenv.config();


export const createCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();
  
  try {
    // 1. Destructure the new Cloudinary fields
    const { name, teacherName, information, imageUrl, publicId } = req.body;
    const { mosqueId } = req.params;

    if (!mosqueId) {
      await transaction.rollback();
      return next(new AppError("mosque id is required", 400));
    }

    const existingCategory = await Category.findOne({
      where: { mosqueId, name, teacherName }
    });

    if (existingCategory) {
      await transaction.rollback();
      return next(
        new AppError("Category with this name and teacher already exists", 400)
      );
    }

    // 2. Create the Category
    const newCategory = await Category.create(
      {
        name,
        teacherName,
        information: information || null,
        mosqueId
      },
      { transaction }
    );

    // 3. Create profile ONLY if Cloudinary data exists
    if (imageUrl && publicId) {
      await CategoryProfile.create(
        {
          image: imageUrl,
          publicId: publicId, // Using the real Cloudinary publicId
          categoryId: newCategory.id
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      newCategory,
      categoryProfile: (imageUrl && publicId) 
        ? { image: imageUrl, publicId } 
        : null
    });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    next(
      new AppError(
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
        500
      )
    );
  }
};





export const updateCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { id } = req.params;
    if (!id) {
      await transaction.rollback();
      return next(new AppError("category id required", 400));
    }

    // 1. Destructure the new Cloudinary fields
    const { name, teacherName, information, imageUrl, publicId } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      await transaction.rollback();
      return next(new AppError("Category not found", 404));
    }

    // 2. Prevent duplicates
    const existingCategory = await Category.findOne({
      where: {
        name: name || category.name,
        teacherName: teacherName || category.teacherName,
        id: { [Op.not]: id },
      },
    });

    if (existingCategory) {
      await transaction.rollback();
      return next(
        new AppError("Category with this name and teacher already exists", 400)
      );
    }

    // 3. Update Category fields
    await category.update(
      {
        name: name ? name.trim() : category.name,
        teacherName: teacherName ? teacherName.trim() : category.teacherName,
        information: information ? information.trim() : category.information,
      },
      { transaction }
    );

    // 4. Handle Image (Cloudinary)
    if (imageUrl && publicId) {
      const categoryProfile = await CategoryProfile.findOne({
        where: { categoryId: id },
        transaction,
      });

      if (categoryProfile) {
        // Store old ID to delete later
        const oldPublicId = categoryProfile.publicId;

        // Update with new data
        categoryProfile.image = imageUrl;
        categoryProfile.publicId = publicId;
        await categoryProfile.save({ transaction });

        // 🔥 Delete old file from Cloudinary
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      } else {
        // Create new profile if it didn't exist
        await CategoryProfile.create(
          {
            categoryId: id,
            image: imageUrl,
            publicId: publicId,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);

    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
        500
      )
    );
  }
};


export const deleteCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();
  try {
    await performCategoryCleanup(req.params.id, transaction);
    await transaction.commit();
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    await transaction.rollback();
    next(new AppError(err.message, 500));
  }
};



export const getAllCategories = async (req, res, next) => {
    try {
        const { mosqueId } = req.params;
        if (!mosqueId) {
            return next(new AppError('mosque id is required', 400));
        }

        const categories = await Category.findAll({
            where: { mosqueId },
            include: {
                model: CategoryProfile, 
                as: 'categoryProfile',
                attributes: ['image']
            },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            categories
        });
    } catch (err) {
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};

