import cloudinary from "../config/claudinary.js";
import dbConnection from "../config/db.js";
import AppError from "../utils/AppError.js";
import dotenv from 'dotenv';
import { Op } from "sequelize";
import {Category, CategoryProfile} from '../models/relationship.js'
import { deleteFileFromR2 } from "../utils/r2.js"; 


dotenv.config();


export const createCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();
  
  try {
    const { name, teacherName, information, fileKey } = req.body;
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

    // 🔥 generate URL from key
    let imageUrl = null;
    if (fileKey) {
      imageUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;
    }

    // ✅ create category
    const newCategory = await Category.create(
      {
        name,
        teacherName,
        information: information || null,
        mosqueId
      },
      { transaction }
    );

    // ✅ create profile if image exists
    if (fileKey) {
      await CategoryProfile.create(
        {
          image: imageUrl,
          publicId: fileKey, // 🔥 this is your key for deletion
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
      categoryProfile: fileKey
        ? { image: imageUrl, publicId: fileKey }
        : null
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





export const updateCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { id } = req.params;
    if (!id) {
      await transaction.rollback();
      return next(new AppError("category id required", 400));
    }

    const { name, teacherName, information, fileKey } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      await transaction.rollback();
      return next(new AppError("Category not found", 404));
    }

    // 🔒 prevent duplicates
    const existingCategory = await Category.findOne({
      where: {
        name,
        teacherName,
        id: { [Op.not]: id },
      },
    });

    if (existingCategory) {
      await transaction.rollback();
      return next(
        new AppError("Category with this name and teacher already exists", 400)
      );
    }

    // ✅ Update category fields
    await category.update(
      {
        name: name ? name.trim() : category.name,
        teacherName: teacherName
          ? teacherName.trim()
          : category.teacherName,
        information: information
          ? information.trim()
          : category.information,
      },
      { transaction }
    );

    // 🔥 HANDLE IMAGE (R2)
    if (fileKey) {
      const categoryProfile = await CategoryProfile.findOne({
        where: { categoryId: id },
      });

      // 👉 build public URL (important)
      const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

      if (categoryProfile) {
        const oldKey = categoryProfile.fileKey; // 👈 store this in DB

        categoryProfile.image = imageUrl;
        categoryProfile.fileKey = fileKey;

        await categoryProfile.save({ transaction });

        // 🔥 delete old file from R2
        if (oldKey) {
          await deleteFileFromR2(oldKey);
        }
      } else {
        await CategoryProfile.create(
          {
            categoryId: id,
            image: imageUrl,
            fileKey: fileKey,
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


// Delete a category (soft delete - admin only)

export const deleteCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { id } = req.params;

    if (!id) {
      await transaction.rollback();
      return next(new AppError("Category id required", 400));
    }

    const category = await Category.findByPk(id, { transaction });

    if (!category) {
      await transaction.rollback();
      return next(new AppError("Category not found", 404));
    }

    const categoryProfile = await CategoryProfile.findOne({
      where: { categoryId: id },
      transaction,
    });

    // 🔥 DELETE FILE FROM R2 (if exists)
    if (categoryProfile && categoryProfile.fileKey) {
      try {
        await deleteFileFromR2(categoryProfile.fileKey);
      } catch (error) {
        await transaction.rollback();
        return next(
          new AppError(
            process.env.NODE_ENV === "development"
              ? error.message
              : `Failed to delete file from storage`
          )
        );
      }
    }

    // ✅ delete profile record (optional but clean)
    if (categoryProfile) {
      await categoryProfile.destroy({ transaction });
    }

    // ✅ delete category
    await category.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });

  } catch (err) {
    if (!transaction.finished) await transaction.rollback();

    console.error(err.message);

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

