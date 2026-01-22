import express, { Router } from 'express';
import { protectRoutes } from '../controllers/auth.js';
import validate from '../middleware/validation.js';
import { createCategorySchema } from '../validation/category.js';
import { createCategory, getAllCategories } from '../controllers/category.js';

const router = express.Router();

router.post('/create-category/:mosqueId', protectRoutes,  validate(createCategorySchema), createCategory);
router.get('/get-category/:mosqueId', protectRoutes, getAllCategories);
export default router; 