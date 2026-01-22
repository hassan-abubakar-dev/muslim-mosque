import express from 'express';
import { protectRoutes } from '../controllers/auth.js';
import { getUserProfile } from '../controllers/userProfile.js';

const router = express.Router();

router.get('/user-profile', protectRoutes, getUserProfile);

export default router;