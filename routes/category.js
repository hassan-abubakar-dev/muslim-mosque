import express, { Router } from 'express';
import { protectRoutes } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { createCategorySchema, idParamSchema, mosqueIdParamSchema, updateCategorySchema } from '../validation/category.js';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../controllers/category.js';

const router = express.Router();



router.post('/create-category/:mosqueId', 
  protectRoutes, 
  validate(mosqueIdParamSchema, 'params'), 
  validate(createCategorySchema, 'body'), 
  createCategory
);

router.get('/get-category/:mosqueId', 
  validate(mosqueIdParamSchema, 'params'), 
  getAllCategories
);

router.put('/update-category/:id', 
  protectRoutes, 
  validate(idParamSchema, 'params'), 
  validate(updateCategorySchema, 'body'), 
  updateCategory
);

router.delete('/delete-category/:id', 
  protectRoutes, 
  validate(idParamSchema, 'params'), 
  deleteCategory
);


export default router; 