// 📄 controllers/videoLibrary.js
import { VideoLibrary, Lecture } from '../models/relationship.js';

/**
 * @desc    Get all saved videos for the logged-in user's library
 * @route   GET /api/video-library/get-library
 */
export const getVideoLibrary = async (req, res) => {
  try {
    const  userId  = req.user.id; // Provided by your auth middleware

    const libraryItems = await VideoLibrary.findAll({
      where: { userId },
      include: [
        {
          model: Lecture,
          as: 'lectureLibrary',
          where: { type: 'video' } // 👈 Inner filter ensures we ONLY grab video documents
        }
      ],
      order: [['createdAt', 'DESC']] // Show most recently saved videos first
    });

    return res.status(200).json({
      status: 'success',  
      results: libraryItems.length,
      library: libraryItems
    });
  } catch (err) {
    console.error("Error inside getVideoLibrary controller:", err.message);
    return res.status(500).json({
      status: 'error',
      message: "Failed to retrieve video library details.",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Save or Remove a video from the user's library (Toggle system)
 * @route   POST /api/video-library/toggle-save
 */
/**
 * @desc    Save or Refresh a video in the user's library (Bring-to-top system)
 * @route   POST /api/video-library/toggle-save/:lectureId
 */
export const toggleVideoLibrary = async (req, res) => {
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
    return res.status(500).json({
      status: 'error',
      message: "Failed to process video library request.",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @desc    Explicitly remove a video from the user's library (Called from Library Dashboard)
 * @route   DELETE /api/video-library/remove/:lectureId
 */
export const removeFromLibrary = async (req, res) => {
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
    return res.status(500).json({
      status: 'error',
      message: "Failed to remove item from library.",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};