
import {Bookmark, Lecture, Mosque} from '../models/relationship.js';

import AppError from '../utils/appError.js';
import { Op } from 'sequelize';
import getLikeOperator from '../utils/dbHelpers.js';
import dotenv from 'dotenv';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

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
      const errorContext = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        ...(req.body?.email && { email: req.body.email }),
      };
      console.error('TOGGLE_BOOKMARK_ERROR: Failed to toggle bookmark', { context: errorContext, error: err });
      next(new AppError(isDev ? err.message : 'Internal server error', 500));
    }
};



export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let { search, type, page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // 1. Build the filter for the included Lecture model
    const lectureWhere = {};
    if (search && search.trim() !== "") {
      const OpLike = getLikeOperator();
      lectureWhere.title = { [OpLike]: `%${search}%` };
    }
    if (type && (type === 'video' || type === 'audio')) {
      lectureWhere.type = type;
    }

    // 2. Fetch only the IDs for the current page
    const { count, rows: bookmarkIds } = await Bookmark.findAndCountAll({
      where: { userId },
      attributes: ['id'],
      include: [
        {
          model: Lecture,
          as: 'lecture',
          attributes: [],
          where: Object.keys(lectureWhere).length > 0 ? lectureWhere : undefined,
          required: Object.keys(lectureWhere).length > 0
        }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    if (count === 0) {
      return res.status(200).json({ status: 'success', totalPages: 0, data: { bookmarks: [] } });
    }

    // 3. Fetch full data
    const bookmarks = await Bookmark.findAll({
      where: { id: bookmarkIds.map(b => b.id) },
      include: [{ model: Lecture, as: 'lecture' }],
      order: [['createdAt', 'DESC']]
    });

    // 4. Inject lastPosition into the lecture object
    const formattedBookmarks = bookmarks.map(b => {
      const bookmarkData = b.get({ plain: true });
      if (bookmarkData.lecture) {
        bookmarkData.lecture.lastPosition = bookmarkData.lastPosition;
      }
      return bookmarkData;
    });

    res.status(200).json({
      status: 'success',
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      data: { bookmarks: formattedBookmarks }
    });
  } catch (err) {
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('GET_BOOKMARKS_ERROR: Failed to fetch bookmarks', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Internal server error', 500));
  }
};