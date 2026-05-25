import express from 'express';
import { loginUser, logOutUser, registerUser, changeUserPassword, requestNewAccessToken, 
    requestNewVerificationCode, forgotPassword, resetPassword  } from '../controllers/auth.js';
import { protectRoutes } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { loginValidationSchema, registerValidationSchema } from '../validation/auth.js';

const router = express.Router();

router.post('/register', validate(registerValidationSchema), registerUser);   
router.post('/new-verification-code', requestNewVerificationCode);
router.post('/login', validate(loginValidationSchema), loginUser);
router.post('/refresh-token', requestNewAccessToken);
router.post('/log-out', protectRoutes, logOutUser);
router.put('/change-password', protectRoutes, changeUserPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;