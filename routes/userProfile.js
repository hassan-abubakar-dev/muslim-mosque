import express from 'express';
import { protectRoutes } from '../controllers/auth.js';
import { getUserProfile, updateUserProfile } from '../controllers/userProfile.js';
import uploadToR2 from '../utils/upload2.js';

const router = express.Router();

router.get('/user-profile', protectRoutes, getUserProfile);
router.put('/user-profile', protectRoutes, uploadToR2, updateUserProfile);

export default router;