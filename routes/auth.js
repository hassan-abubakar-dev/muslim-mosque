import express from 'express';
import { registerUser } from '../controllers/auth.js';
import validate from '../middleware/validation.js';
import { registerValidationSchema } from '../validation/auth.js';

const router = express.Router();

router.post('/register', validate(registerValidationSchema), registerUser);   

export default router;