// 📄 controllers/videoLibrary.js
import { VideoLibrary, Lecture, Category, Mosque } from '../models/relationship.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @desc    Get all saved videos for the logged-in user's library
 * @route   GET /api/video-library/get-library
 */


export const getVideoLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 1. Setup Pagination and Search params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || "";

    // 2. Define filter for the Lecture title
    const lectureWhere = { type: 'video' };
    if (searchTerm) {
      lectureWhere.title = { [Op.like]: `%${searchTerm}%` };
    }

    // 3. Find and Count for Pagination metadata
    const { count, rows: libraryItems } = await VideoLibrary.findAndCountAll({
      where: { userId },
      limit,
      offset,
      include: [
        {
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
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 4. Format the result
    const formattedLibrary = libraryItems.map(item => {
      const lec = item.lectureLibrary.toJSON();
      const { category, ...cleanLec } = lec; 
      return {
        ...cleanLec,
        addedToLibraryAt: item.createdAt,
        mosqueName: lec.category?.mosqueCategory?.name || "General Lecture"
      };
    });

    return res.status(200).json({
      status: 'success',
      totalResults: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      library: formattedLibrary
    });
  } catch (err) {
    console.error("Error in getVideoLibrary:", err.message);
    return next(new AppError(process.env.NODE_ENV === 'development' ? err.message : "Failed to retrieve video library.", 500));
  }
};;

/**
 * @desc    Save or Remove a video from the user's library (Toggle system)
 * @route   POST /api/video-library/toggle-save
 */
/**
 * @desc    Save or Refresh a video in the user's library (Bring-to-top system)
 * @route   POST /api/video-library/toggle-save/:lectureId
 */
export const toggleVideoLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id; // Provided by your auth middleware
    const { lectureId } = req.params; 

    if (!lectureId) {
      return res.status(400).json({ status: 'error', message: "lectureId is required." });
    }

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
    console.error("Error inside toggleVideoLibrary controller:", err.message);
    return next(new AppError(process.env.NODE_ENV === 'development' ? err.message : "Failed to process video library request.", 500));
  }
};

/**
 * @desc    Explicitly remove a video from the user's library (Called from Library Dashboard)
 * @route   DELETE /api/video-library/remove/:lectureId
 */
export const removeFromLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id; 
    const { lectureId } = req.params;

    if (!lectureId) {
      return res.status(400).json({ status: 'error', message: "lectureId is required." });
    }

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
    console.error("Error inside removeFromLibrary controller:", err.message);
    return next(new AppError(process.env.NODE_ENV === 'development' ? err.message : "Failed to remove item from library.", 500));
  }
};