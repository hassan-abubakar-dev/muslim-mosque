import express from 'express';
import { getUnreadNotificationCount, getNotifications } from '../controllers/notification.js';
import { protectRoutes } from '../middleware/auth.js';

const router = express.Router();

router.get('/unread-count', protectRoutes, getUnreadNotificationCount);
router.get('/get', protectRoutes, getNotifications);

export default router;