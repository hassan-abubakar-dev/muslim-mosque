import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { getUserProfile, updateUserProfile } from '../controllers/userProfile.js';
import { updateProfileSchema } from '../validation/userProfile.js';
import validate from '../middleware/validation.js';


const router = express.Router();

router.get('/user-profile', protectRoutes, getUserProfile);
router.put('/update-user-profile', 
    protectRoutes, 
    validate(updateProfileSchema, 'body'), 
    updateUserProfile
);
export default router;