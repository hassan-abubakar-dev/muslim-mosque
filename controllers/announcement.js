import {Announcement, Mosque, User, Notification} from '../models/relationship.js'
import AppError from '../utils/appError.js';
import cloudinary from '../config/claudinary.js';
import sequelize from '../config/db.js';

const isDev = process.env.NODE_ENV === 'development';

export const createAnnouncement = async (req, res, next) => {
    try {
        const { mosqueId } = req.params;
        const { title, content, imageUrl, imagePublicId } = req.body;
        // const adminId = req.user.id; // From your auth middleware

        // Basic verification: does mosque exist?
        const mosque = await Mosque.findByPk(mosqueId);
        if (!mosque) {
            return next(new AppError('Mosque not found', 404));
        }

        // Logic: Save image data ONLY if both fields are provided, else NULL
        const announcementData = {
            title,
            content,
            mosqueId,
            image: (imageUrl && imagePublicId) ? imageUrl : null,
            ipublicId: (imageUrl && imagePublicId) ? imagePublicId : null,
        };

        const newAnnouncement = await Announcement.create(announcementData);
    
 
         try {
             notification = await Notification.create({
                mosqueId,
                message: `New announcement added: ${title}`,
                type: 'announcement',
                announcementId: newAnnouncement.id
              });
            }
            catch (error) {
              console.error("Error creating notification:", error);
            }

        res.status(201).json({
            status: 'success',
            data: { announcement: newAnnouncement }
        });

    } catch (err) {
        console.error('create announcement error', err)
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

        // Authorization check (Ensure this admin owns the mosque linked to the announcement)
        // [Add your auth logic here if needed]

        // --- STEP A: Clear Space on Cloudinary ---
        // If this announcement had an image, use the public_id to destroy it on Cloudinary
        if (announcement.publicId) {
            try {
                // 'destroy' removes the remote asset permanently freeing your storage quota
                await cloudinary.uploader.destroy(announcement.publicId);
            } catch (cloudErr) {
                // We log but don't block deletion. If it fails, manual review is needed.
                console.error('Failed to delete asset from Cloudinary:', announcement.publicId, cloudErr);
            }
        }

        // --- STEP B: Delete from Database ---
        await announcement.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Announcement deleted successfully and remote image cleared.'
        });

    } catch (err) {
        console.error('delete announcement error', err)
        next(new AppError(isDev ? err.message : 'fail to delete announcement', 500));
    }
};


// 3. Get Mosque Announcements (With optimized fetch strategy)
export const getAnnouncements = async (req, res, next) => {
    try {
        const { mosqueId } = req.params;
        // Parse page and limit from query string, defaults to page 1, 10 items per page
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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
        console.error('get announcement error', err);
        next(new AppError(isDev ? err.message : 'Failed to get announcements', 500));
    }
};