import express from 'express';
import { getLoggedInUser, updateUserInfo, searchUserByEmail, getUserCounts, getAllVerifiedUsers } from '../controllers/user.js';
import { authorize, protectRoutes } from '../middleware/auth.js';

const router = express.Router();

router.get('/login-user', protectRoutes, getLoggedInUser);
router.get('/get-analysis', protectRoutes, authorize('superAdmin'), getUserCounts)
router.get('/get-users', protectRoutes, authorize('superAdmin'), getAllVerifiedUsers);
router.post('/search-by-email', protectRoutes, searchUserByEmail);
router.put('/update-profile', protectRoutes, updateUserInfo);

export default router;