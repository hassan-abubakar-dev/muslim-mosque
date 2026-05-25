import express, { Router } from 'express';
import { protectRoutes } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { createCategorySchema, updateCategorySchema } from '../validation/category.js';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../controllers/category.js';

const router = express.Router();

router.post('/create-category/:mosqueId', protectRoutes,  validate(createCategorySchema),  createCategory);
router.get('/get-category/:mosqueId',  getAllCategories);
router.put('/update-category/:id', protectRoutes, validate(updateCategorySchema), updateCategory);
router.delete('/delete-category/:id', protectRoutes, deleteCategory);
export default router; 