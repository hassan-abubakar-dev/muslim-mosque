import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { getUserProfile, updateUserProfile } from '../controllers/userProfile.js';


const router = express.Router();

router.get('/user-profile', protectRoutes, getUserProfile);
router.put('/update-user-profile', protectRoutes,  updateUserProfile);

export default router;