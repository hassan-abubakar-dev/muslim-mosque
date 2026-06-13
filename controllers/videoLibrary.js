// 📄 controllers/videoLibrary.js
import { VideoLibrary, Lecture, Category, Mosque } from '../models/relationship.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';
import getLikeOperator from '../utils/dbHelpers.js';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';



export const getVideoLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    
    // get data fro query
const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const searchTerm = req.query.search || '';
const offset = (page - 1) * limit;

    // 2. Define filter
    const lectureWhere = { type: 'video' };
    if (searchTerm) {
      const OpLike = getLikeOperator();
      lectureWhere.title = { [OpLike]: `%${searchTerm}%` };
    }

    // 3. Find and Count
    const { count, rows: libraryItems } = await VideoLibrary.findAndCountAll({
      where: { userId },
      limit,
      offset,
      include: [{
        model: Lecture,
        as: 'lectureLibrary',
        where: lectureWhere,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id'],
          include: [{
            model: Mosque,
            as: 'mosqueCategory',
            attributes: ['name']
          }]
        }]
      }],
      order: [['createdAt', 'DESC']],
      distinct: true // Crucial for accurate counts with includes
    });

    // 4. Format and sanitize
   // 4. Format and sanitize
const formattedLibrary = libraryItems.map(item => {
  const lec = item.lectureLibrary?.get({ plain: true }) || {};
  
  return {
    ...lec,
    id: lec.id, 
    title: lec.title,
    addedToLibraryAt: item.createdAt,
    mosqueName: lec.category?.mosqueCategory?.name || "General Lecture"
  };
});

    return res.status(200).json({
      status: 'success',
      totalResults: count,
      totalPages: Math.ceil(count / limit),
      hasMore: page < Math.ceil(count / limit),
      currentPage: page,
      library: formattedLibrary
    });
  } catch (err) {
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
    console.error('GET_VIDEO_LIBRARY_ERROR: Failed to fetch video library', { context: errorContext, error: err });
    return next(new AppError(isDev ? err.message : "Failed to retrieve video library.", 500));
  }
};


export const toggleVideoLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id; // Provided by your auth middleware
    const { lectureId } = req.params; 


    // 1. Verify that this lecture actually exists and is a video
    const lecture = await Lecture.findByPk(lectureId);
    if (!lecture) {
      return res.status(404).json({ status: 'error', message: "Lecture not found." });
    }
    if (lecture.type !== 'video') {
      return res.status(400).json({ 
        status: 'error', 
        message: "Action restricted. Only video type items can be managed through the Video Library controller." 
      });
    }

    // 2. Check if it's already saved in the library
    const existingSave = await VideoLibrary.findOne({
      where: { userId, lectureId }
    });

    if (existingSave) {
      // 💡 UX Strategy: Destroy the old record so the new one gets stamped fresh at the top
      await existingSave.destroy();
    }

    // 3. Create a fresh record (moves it to the top of the list automatically via new timestamp)
    await VideoLibrary.create({ userId, lectureId });
    
    return res.status(201).json({
      status: 'success',
      message: existingSave 
        ? "Video moved to the top of your library!" 
        : "Video successfully saved to library.",
      isSaved: true
    });

  } catch (err) {
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.params?.lectureId && { lectureId: req.params.lectureId }) };
    console.error('TOGGLE_VIDEO_LIBRARY_ERROR: Failed to toggle video library', { context: errorContext, error: err });
    return next(new AppError(isDev ? err.message : "Failed to process video library request.", 500));
  }
};



export const removeFromLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id; 
    const { lectureId } = req.params;

    // Find the record in the library container
    const existingSave = await VideoLibrary.findOne({
      where: { userId, lectureId }
    });

    if (!existingSave) {
      return res.status(404).json({ 
        status: 'error', 
        message: "This lecture was not found in your library." 
      });
    }

    // Explicitly delete the record from the independent table
    await existingSave.destroy();

    return res.status(200).json({
      status: 'success',
      message: "Video removed from library successfully.",
      isSaved: false
    });
  } catch (err) {
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.params?.lectureId && { lectureId: req.params.lectureId }) };
    console.error('REMOVE_FROM_LIBRARY_ERROR: Failed to remove item from library', { context: errorContext, error: err });
    return next(new AppError(isDev ? err.message : "Failed to remove item from library.", 500));
  }
};