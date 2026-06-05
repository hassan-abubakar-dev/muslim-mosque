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
        let { page = 1, limit = 15 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 15;
        const offset = (page - 1) * limit;

        // 1. Fetch mosque IDs AND the date the user followed them
        const followedMosques = await FollowMosque.findAll({
            where: { userId },
            attributes: ['mosqueId', 'createdAt'] // We need createdAt here
        });

        if (followedMosques.length === 0) {
            return res.status(200).json({ status: 'success', notifications: [], totalPages: 0 });
        }

        // 2. Build the dynamic filter using Op.or
        // Logic: (mosqueId = A AND createdAt >= FollowDateA) OR (mosqueId = B AND createdAt >= FollowDateB)
        const filter = followedMosques.map(f => ({
            mosqueId: f.mosqueId,
            createdAt: { [Op.gte]: f.createdAt }
        }));

        // 3. High-speed query with dynamic filtering
        const notifications = await Notification.findAndCountAll({
            where: { [Op.or]: filter },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        // 4. Update the user's check timestamp
        await User.update(
            { lastNotificationCheck: new Date() },
            { where: { id: userId } }
        );

        res.status(200).json({
            status: 'success',
            currentPage: page,
            totalPages: Math.ceil(notifications.count / limit),
            totalItems: notifications.count,
            notifications: notifications.rows,
        });
        
    } catch (err) {
        next(new AppError(err.message, 500));
    }
};