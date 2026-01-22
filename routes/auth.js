import express from 'express';
import { loginUser, logOutUser, protectRoutes, registerUser, requestNewAccessToken } from '../controllers/auth.js';
import validate from '../middleware/validation.js';
import { loginValidationSchema, registerValidationSchema } from '../validation/auth.js';

const router = express.Router();

router.post('/register', validate(registerValidationSchema), registerUser);   
router.post('/login', validate(loginValidationSchema), loginUser);
router.post('/refresh-token', requestNewAccessToken);
router.post('/log-out', protectRoutes, logOutUser);
export default router;