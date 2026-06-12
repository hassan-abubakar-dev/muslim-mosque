import {Announcement, Mosque, User, Notification} from '../models/relationship.js'
import AppError from '../utils/appError.js';
import cloudinary from '../config/claudinary.js';
import sequelize from '../config/db.js';
import dbConnection from '../config/db.js';

const isDev = process.env.NODE_ENV === 'development';

export const createAnnouncement = async (req, res, next) => {
    const transaction = await dbConnection.transaction();
    try {
        const { mosqueId } = req.params;
        const { title, content, imageUrl, publicId } = req.body;
      

        // Basic verification: does mosque exist?
        const mosque = await Mosque.findByPk(mosqueId);
        if (!mosque) {
            return next(new AppError('Mosque not found', 404));
        }

        
        const announcementData = {
            title,
            content,
            mosqueId,
            image: (imageUrl && publicId) ? imageUrl : null,
            publicId: (imageUrl && publicId) ? publicId : null,
        };

        const newAnnouncement = await Announcement.create(announcementData, { transaction });
    
 
     
            const notification = await Notification.create({
                mosqueId,
                message: `New announcement added: ${title}`,
                type: 'announcement',
                announcementId: newAnnouncement.id
              }, {transaction});
   

            await transaction.commit();

        res.status(201).json({
            status: 'success',
            data: { announcement: newAnnouncement }
        });

    } catch (err) {
        if (transaction && typeof transaction.rollback === 'function') await transaction.rollback();
        const errorContext = {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            ...(req.body?.email && { email: req.body.email }),
        };
        console.error('CREATE_ANNOUNCEMENT_ERROR: Failed to create announcement', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'fail to create announcement', 500));
    }
};


export const deleteAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByPk(id);

        if (!announcement) {
            return next(new AppError('Announcement not found', 404));
        }

        if (announcement.publicId) {
            try {
                await cloudinary.uploader.destroy(announcement.publicId);
            } catch (cloudErr) {
                console.error('Failed to delete asset from Cloudinary:', announcement.publicId, cloudErr);
            }
        }

        //delete from db
        await announcement.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Announcement deleted successfully and remote image cleared.'
        });

    } catch (err) {
        const errorContext = {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            ...(req.body?.email && { email: req.body.email }),
        };
        console.error('DELETE_ANNOUNCEMENT_ERROR: Failed to delete announcement', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'fail to delete announcement', 500));
    }
};



export const getAnnouncements = async (req, res, next) => {
    try {
        const { mosqueId } = req.params;
        // Parse page and limit from query string, defaults to page 1, 10 items per page
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Verify mosque exists
        const mosque = await Mosque.findByPk(mosqueId);
        if (!mosque) {
            return next(new AppError('Mosque not found', 404));
        }

        // Use findAndCountAll to get both the rows and the total count for the frontend
        const { count, rows } = await Announcement.findAndCountAll({
            where: { mosqueId, isActive: true },
            order: [['created_at', 'DESC']], // Newest first
            limit: limit,
            offset: offset
        });

        res.status(200).json({
            status: 'success',
            results: rows.length,
            totalItems: count, // Total records in DB matching the filter
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            announcements: rows
        });

    } catch (err) {
        const errorContext = {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            ...(req.body?.email && { email: req.body.email }),
        };
        console.error('GET_ANNOUNCEMENTS_ERROR: Failed to fetch announcements', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'Failed to get announcements', 500));
    }
};