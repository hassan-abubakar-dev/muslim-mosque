import express from 'express';
import { getLoggedInUser } from '../controllers/user.js';
import { protectRoutes } from '../controllers/auth.js';

const router = express.Router();

router.get('/login-user', protectRoutes, getLoggedInUser);

export default router;