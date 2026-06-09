import express from 'express';
import { getLoggedInUser, updateUserInfo, searchUserByEmail, getAllVerifiedUsers, toggleUserRole, deleteAccount } from '../controllers/user.js';
import { authorize, protectRoutes } from '../middleware/auth.js';

const router = express.Router();

router.get('/login-user', protectRoutes, getLoggedInUser);
router.get('/get-users', protectRoutes, authorize('superAdmin'), getAllVerifiedUsers);
router.post('/search-by-email', protectRoutes, searchUserByEmail);
router.patch('/toggle-role/:userId', protectRoutes, authorize('superAdmin'), toggleUserRole)
router.put('/update-profile', protectRoutes, updateUserInfo);
router.delete('/delete-account', protectRoutes, deleteAccount);

export default router;