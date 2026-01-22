import express from 'express';
import { protectRoutes } from '../controllers/auth.js';
import { getMosque, registerMosque } from '../controllers/mosque.js';
import validate from '../middleware/validation.js';
import { registerMosqueValidationSchema } from '../validation/mosque.js';

const router = express.Router();

router.post('/register-mosque', protectRoutes, validate(registerMosqueValidationSchema), registerMosque);
router.get('/get-mosques', getMosque);

export default router;