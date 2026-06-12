import express from 'express';
import { loginUser, logOutUser, registerUser, changeUserPassword, requestNewAccessToken, 
    requestNewVerificationCode, forgotPassword, resetPassword  } from '../controllers/auth.js';
import { protectRoutes } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { loginValidationSchema, registerValidationSchema, emailValidationSchema, passwordChangeSchema, resetPasswordSchema } from '../validation/auth.js';
import { authLimiter, forgotPasswordLimiter, passwordResetLimiter, verifyCodeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerValidationSchema), registerUser);   
router.post('/new-verification-code', verifyCodeLimiter, validate(emailValidationSchema), requestNewVerificationCode);
router.post('/login', authLimiter, validate(loginValidationSchema), loginUser);
router.post('/refresh-token', requestNewAccessToken);
router.post('/log-out', protectRoutes, logOutUser);
router.put('/change-password', passwordResetLimiter, protectRoutes, validate(passwordChangeSchema), changeUserPassword);
router.post('/forgot-password', forgotPasswordLimiter, validate(emailValidationSchema), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPassword);
export default router;