import Category from "../models/category.js";
import AppError from "../utils/AppError.js";
import { Op } from "sequelize";


export const createCategory = async (req, res, next) => {
    try {
        const { name, teacherName, information } = req.body;
        const {mosqueId} = req.params

        if(!mosqueId){
            return next(new AppError('mosque id is required'));
        }
        // Check if category with same name already exists
        const existingCategory = await Category.findOne({
            where: {mosqueId, name, teacherName} 
        });

        if (existingCategory) {
            return next(new AppError('Category with this name and teacher already exists', 400));
        }

        console.log('mosqueId', mosqueId);
        
        const newCategory = await Category.create({
            name,
            teacherName,
            information: information ? information : null,
            mosqueId
        });

        

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            newCategory
        });
    } catch (err) {
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};

export const getAllCategories = async (req, res, next) => {
    try {
         const {mosqueId} = req.params
          if(!mosqueId){
            return next(new AppError('mosque id is required'));
        }
        const categories = await Category.findAll({
            where: { mosqueId },
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

// Get a single category by ID
export const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate category ID
        const { error } = categoryIdValidation({ id });
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const category = await Category.findOne({
            where: { id, isActive: true },
            attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt']
        });

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (err) {
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};



// Update a category (admin only)
export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate category ID
        const { error: idError } = categoryIdValidation({ id });
        if (idError) {
            return next(new AppError(idError.details[0].message, 400));
        }

        // Validate input using Joi
        const { error } = updateCategoryValidation(req.body);
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const { name, description, isActive } = req.body;

        const category = await Category.findByPk(id);

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        // Check if name is being changed and if the new name already exists
        if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
            const existingCategory = await Category.findOne({
                where: {
                    name: name.trim(),
                    id: {
                        [Op.not]: id
                    }
                }
            });

            if (existingCategory) {
                return next(new AppError('Category with this name already exists', 400));
            }
        }

        await category.update({
            name: name ? name.trim() : category.name,
            description: description !== undefined ? description.trim() : category.description,
            isActive: isActive !== undefined ? isActive : category.isActive
        });

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (err) {
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};

// Delete a category (soft delete - admin only)
export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate category ID
        const { error } = categoryIdValidation({ id });
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const category = await Category.findByPk(id);

        if (!category) {
            return next(new AppError('Category not found', 404));
        }

        await category.update({ isActive: false });

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (err) {
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};