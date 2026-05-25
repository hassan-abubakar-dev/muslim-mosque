import Notification from '../models/Notification.js';
import User from '../models/User.js';
import FollowMosque from '../models/followMosque.js';
import { Op } from 'sequelize';
import Announcement from '../models/Announcement.js';
import Lecture from '../models/Lecture.js';
import AppError from '../utils/appError.js';

/**
 * 1. Create a New Notification (API Controller Route)
 * Expects mosqueId, message, type, and optional announcementId/lectureId in req.body
 */
export const createNotification = async (req, res, next) => {
    try {
        const { mosqueId, message, type, announcementId, lectureId } = req.body;

        // Validation check using your AppError class
        if (!mosqueId || !message || !type) {
            return next(new AppError('Please provide mosqueId, message, and type fields.', 400));
        }

        const notification = await Notification.create({
            mosqueId,
            message,
            type,
            announcementId: announcementId || null,
            lectureId: lectureId || null
        });

        res.status(201).json({
            status: 'success',
            data: { notification }
        });
    } catch (err) {
        console.error('Error creating notification:', err);
        next(
            new AppError(
                process.env.NODE_ENV === 'development' ? err.message : 'Failed to create notification',
                500
            )
        );
    }
};

/**
 * 2. Get Unread Notifications Count
 */
export const getUnreadNotificationCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId, { attributes: ['lastNotificationCheck'] });

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        const followedMosques = await FollowMosque.findAll({
            where: { userId },
            attributes: ['mosqueId']
        });
        
        const mosqueIds = followedMosques.map(f => f.mosqueId);

        const unreadCount = await Notification.count({
            where: {
                mosqueId: { [Op.in]: mosqueIds },
                createdAt: { [Op.gt]: user.lastNotificationCheck || new Date(0) }
            }
        });

        res.status(200).json({
            status: 'success',
            unreadCount
        });
    } catch (err) {
        next(
            new AppError(
                process.env.NODE_ENV === 'development' ? err.message : 'Failed to get unread notification count',
                500
            )
        );
    }
};


export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // 1. Sanitize pagination values to prevent SQL/Sequelize injection quirks
        let { page = 1, limit = 15 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
         
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 15;
        
        const offset = (page - 1) * limit;

        // Fix: corrected typo from console.loge to console.log
        console.log('Fetching notifications for user:', userId);

        // 2. Fetch the list of mosque IDs this user follows
        const followedMosques = await FollowMosque.findAll({
            where: { userId },
            attributes: ['mosqueId']
        });
        const mosqueIds = followedMosques.map(f => f.mosqueId);

        // 3. High-speed database query (Zero JOIN operations!)
        const notifications = await Notification.findAndCountAll({
            where: { mosqueId: { [Op.in]: mosqueIds } },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            // 🔥 REMOVED: Heavy database joins dropped for extreme speed and Neon efficiency!
        });

        // 4. Update the user's notification badge timestamp tracking
        await User.update(
            { lastNotificationCheck: new Date() },
            { where: { id: userId } }
        );

        const totalPages = Math.ceil(notifications.count / limit);

        res.status(200).json({
            status: 'success',
            currentPage: page,
            totalPages,
            totalItems: notifications.count,
            results: notifications.rows.length,
             notifications: notifications.rows,
             followedMosques
        
        });
        
    } catch (err) {
        console.error('Error fetching notifications:', err);
        next(
            new AppError(
                process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch notifications',
                500
            )
        );
    }
};