import express, { Router } from 'express';
import { protectRoutes } from '../controllers/auth.js';
import validate from '../middleware/validation.js';
import { createCategorySchema, updateCategorySchema } from '../validation/category.js';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../controllers/category.js';
import uploadToR2 from '../utils/upload2.js';

const router = express.Router();

router.post('/create-category/:mosqueId', protectRoutes,  validate(createCategorySchema),  uploadToR2, createCategory);
router.get('/get-category/:mosqueId', protectRoutes, getAllCategories);
router.put('/update-category/:id', protectRoutes, validate(updateCategorySchema), uploadToR2, updateCategory);
router.delete('/delete-category/:id', protectRoutes, deleteCategory);
export default router; 