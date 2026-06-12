import express from 'express';
import { getLoggedInUser, updateUserInfo, searchUserByEmail, getAllVerifiedUsers, toggleUserRole, deleteAccount } from '../controllers/user.js';
import { authorize, protectRoutes } from '../middleware/auth.js';
import { 
    updateUserInfoSchema, 
    searchEmailSchema, 
    getUsersQuerySchema, 
    userIdParamsSchema 
} from '../validation/user.js';
import validate  from '../middleware/validation.js';

const router = express.Router();

router.get('/login-user', protectRoutes, getLoggedInUser);
router.get('/get-users', protectRoutes, authorize('superAdmin'), validate(getUsersQuerySchema, 'query'), getAllVerifiedUsers);
router.post('/search-by-email', protectRoutes, validate(searchEmailSchema, 'body'), searchUserByEmail);
router.patch('/toggle-role/:userId', protectRoutes, authorize('superAdmin'), validate(userIdParamsSchema, 'params'), toggleUserRole);
router.put('/update-profile', protectRoutes, validate(updateUserInfoSchema, 'body'), updateUserInfo);
router.delete('/delete-account', protectRoutes, deleteAccount);

export default router;