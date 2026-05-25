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
              await Notification.create({
                mosqueId,
                message: `New announcement added: ${title}`,
                type: 'lecture',
                lectureId: lecture.id
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

        // Verify mosque
        const mosque = await Mosque.findByPk(mosqueId);
        if (!mosque) {
            return next(new AppError('Mosque not found', 404));
        }

        // Fetch announcements sorted by newest first
        const announcements = await Announcement.findAll({
            where: {  mosqueId, isActive: true },
            order: [['created_at', 'DESC']],
            
        });

       

        const cappedAnnouncements = announcements.slice(0, 5);

        res.status(200).json({
            status: 'success',
            results: cappedAnnouncements.length,
            // Inform frontend how many actually exist in DB for your manual review notice
            totalInDb: announcements.length, 
            announcements: cappedAnnouncements 
        });

    } catch (err) {
        console.error('get announcement error', err)
        next(isDev ? err.message : 'fail to get announcements', 500);
    }
};