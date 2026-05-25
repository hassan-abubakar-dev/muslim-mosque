
import {Bookmark, Lecture, Mosque} from '../models/relationship.js';

import AppError from '../utils/appError.js';

// 1. Toggle Bookmark (Add or Remove)
export const toggleBookmark = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { lastPosition = 0 } = req.body;
        
        // ✅ CHANGED TO CURLY BRACES: Proper object destructuring
        const { lectureId } = req.params; 

        // 🛡️ Guard Clause
        if (!lectureId) {
            return next(new AppError('Lecture ID is required to toggle a bookmark.', 400));
        }

        // Check if bookmark already exists
        const existingBookmark = await Bookmark.findOne({
            where: { userId, lectureId } 
        });

        if (existingBookmark) {
            // If it exists, remove it
            await existingBookmark.destroy();
            return res.status(200).json({
                status: 'success',
                bookmarked: false,
                message: 'Bookmark removed'
            });
        }

        // If it doesn't exist, create it
        const newBookmark = await Bookmark.create({
            userId,
            lectureId,
            lastPosition
        });

        return res.status(201).json({
            status: 'success',
            bookmarked: true,
            data: newBookmark
        });
    } catch (err) {
        next(err);
    }
};
// 2. Get My Bookmarks (The Library List)
export const getBookmarks = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const bookmarks = await Bookmark.findAll({
            where: { userId },
            include: [
                {
                    model: Lecture,
                    as: 'lecture'
                }
            ],
            order: [['createdAt', 'DESC']] // Show most recently saved first
        });

        res.status(200).json({
            status: 'success',
            results: bookmarks.length,
            data: { bookmarks }
        });
    } catch (err) {
        next(err);
    }
};