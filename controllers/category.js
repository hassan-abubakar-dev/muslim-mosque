import cloudinary from "../config/claudinary.js";
import dbConnection from "../config/db.js";
import Category from "../models/category.js";
import AppError from "../utils/AppError.js";
import dotenv from 'dotenv';
import { Op } from "sequelize";
import CategoryProfile from "../models/categoryProfile.js";

dotenv.config();


export const createCategory = async (req, res, next) => {  
  const transaction = await dbConnection.transaction();

  try {
    const { name, teacherName, information } = req.body;
    const { mosqueId } = req.params;
    console.log("req.file", req.file)

    if (!mosqueId) {
      await transaction.rollback();
      return next(new AppError("mosque id is required", 400));
    }

    // prevent duplicates
    const existingCategory = await Category.findOne({
      where: { mosqueId, name, teacherName }
    });

    if (existingCategory) {
      await transaction.rollback();
      return next(
        new AppError("Category with this name and teacher already exists", 400)
      );
    }

    let image = null;
    let publicId = null;

    /**  HANDLE IMAGE (OPTIONAL) */
    if (req.file) {
        if (req.file.size > 5 * 1024 * 1024) {
            return next(new AppError("Image too large. Max 5MB", 400));
    }
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "category-image" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
          .end(req.file.buffer);
      });

      image = result.secure_url;
      publicId = result.public_id;
    }

    /** ✅ CREATE CATEGORY */
    const newCategory = await Category.create(
      {
        name,
        teacherName,
        information: information || null,
        mosqueId
      },
      { transaction }
    );

    /* CREATE PROFILE ONLY IF IMAGE EXISTS */
    if (image && publicId) {
      await CategoryProfile.create(
        {
          image,
          publicId,
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
      categoryProfile: image
        ? { image, publicId }
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


export const getAllCategories = async (req, res, next) => {
    try {
        const { mosqueId } = req.params
        if (!mosqueId) {
            return next(new AppError('mosque id is required'));
        }
        const categories = await Category.findAll({
            where: { mosqueId },
            include: {
                model: CategoryProfile, as: 'categoryProfile',
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




// Update a category (admin only)
export const updateCategory = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { id } = req.params;
    if (!id) {
      await transaction.rollback();
      return next(new AppError("category id required", 400));
    }

    const { name, teacherName, information } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      await transaction.rollback();
      return next(new AppError("Category not found", 404));
    }

    const existingCategory = await Category.findOne({
      where: {
        name: name,
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

    //  Update category fields
    await category.update(
      {
        name: name ? name.trim() : category.name,
        teacherName: teacherName ? teacherName.trim() : category.teacherName,
        information: information ? information.trim() : category.information,
      },
      { transaction }
    );

    //  Optional image upload
    if (req.file) {
           if (req.file.size > 5 * 1024 * 1024) {
            return next(new AppError("Image too large. Max 5MB", 400));
    }
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "categories-image" }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          })
          .end(req.file.buffer);
      });

      const categoryProfile = await CategoryProfile.findOne({
        where: { categoryId: id },
      });

      if (categoryProfile) {
        const oldPublicId = categoryProfile.publicId;

        categoryProfile.image = result.secure_url;
        categoryProfile.publicId = result.public_id;
        await categoryProfile.save({ transaction });

        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      } else {
        // If no profile exists yet, create one
        await CategoryProfile.create(
          {
            categoryId: id,
            image: result.secure_url,
            publicId: result.public_id,
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
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
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
            return next(new AppError('Category id required', 400));
        }

        const category = await Category.findByPk(id, { transaction });

        if (!category) {
            await transaction.rollback();
            return next(new AppError('Category not found', 404));
        }

        const categoryProfile = await CategoryProfile.findOne({ where: { categoryId: id }, transaction });

        if (categoryProfile) {
            try {
                // cloudinary.destroy does not need to be awaited unless you want
                await cloudinary.uploader.destroy(categoryProfile.publicId);
            } catch (error) {
                await transaction.rollback();
                return next(
                    new AppError(
                        process.env.NODE_ENV === 'development'
                            ? error.message
                            : `Something went wrong while deleting category ${category.name}`
                    )
                );
            }
        }

        await category.destroy({ transaction });

        await transaction.commit(); // ✅ COMMIT only once at the end

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (err) {
        // Only rollback if transaction not finished
        if (!transaction.finished) await transaction.rollback();
        console.error(err.message);
        next(
            new AppError(
                process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
                500
            )
        );
    }
};
