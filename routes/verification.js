import express from 'express';
import validate from '../middleware/validation.js';
import { verifyNewUserAccount, verifyRecoveryCode } from '../controllers/verification.js';
import { verifyEmailSchema, verifyRecoverySchema } from '../validation/verification.js';
import { verifyCodeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/verify', 
    verifyCodeLimiter,
    validate(verifyEmailSchema, 'body'), 
    verifyNewUserAccount
);

router.post('/verify-recovery-code', 
    verifyCodeLimiter,
    validate(verifyRecoverySchema, 'body'), 
    verifyRecoveryCode
);
export default router;