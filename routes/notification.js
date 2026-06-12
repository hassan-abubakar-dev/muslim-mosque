import express from 'express';
import { getUnreadNotificationCount, getNotifications } from '../controllers/notification.js';
import { protectRoutes } from '../middleware/auth.js';
import { getNotificationsQuerySchema } from '../validation/notification.js';
import validate from '../middleware/validation.js';

const router = express.Router();

router.get('/unread-count', protectRoutes, getUnreadNotificationCount);
router.get('/get', 
    protectRoutes, 
    validate(getNotificationsQuerySchema, 'query'), 
    getNotifications
);

export default router;