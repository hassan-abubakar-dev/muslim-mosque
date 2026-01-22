import express from 'express';
import validate from '../middleware/validation.js';
import { verifyNewUserAccount } from '../controllers/verification.js';
import { verifyEmailSchema } from '../validation/verification.js';

const router = express.Router();

router.post('/verify', validate(verifyEmailSchema), verifyNewUserAccount); 

export default router;