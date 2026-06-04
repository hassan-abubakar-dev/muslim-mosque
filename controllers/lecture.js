// import Lecture from "../models/lecture.js";
// import Category from "../models/category.js";
import AppError from "../utils/AppError.js";
import { deleteFileFromR2 } from "../utils/r2.js";
import dotenv from "dotenv";
// import Notification from "../models/Notification.js";
// import Bookmark from "../models/bookmark.js";
import { Lecture, Category, Notification, Bookmark } from "../models/relationship.js";
import { Op } from "sequelize";

dotenv.config();


// Save lecture metadata to database
export const saveLectureMetadata = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { title, type, key, duration, url, thumbnail, videoId, mosqueId } = req.body;
    console.log(mosqueId, 'lecture controller mosque id')

    // 1. Basic Category Check
    if (!categoryId) {
      return next(new AppError("Category ID is required", 400));
    }

    // 2. Title is required for both audio and video
    if (!title) {
      return next(new AppError("Title is required", 400));
    }

  if (!mosqueId) {
  return next(new AppError("Mosque ID is required for notification distribution", 400));
}

    // Verify category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Declare the lecture variable outside the blocks so the response can see it
    let lecture;

    // 3. Conditional validation and creation based on Type/Key
    if (type === "audio" || key) {
      // Audio specific validation
      if (!key) {
        return next(new AppError("Audio file key is required", 400));
      }

      // Build full public URL from R2
      const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      lecture = await Lecture.create({
        title,
        type: "audio",
        url: fileUrl,   // full URL for frontend
        publicId: key,  // store key for deletion
        duration,       // Audio retains duration tracking
        categoryId,
      });

    } else if (type === "video" || videoId) {
      // Video specific validation
      if (!videoId) {
        return next(new AppError("YouTube Video ID is required", 400));
      }

      // We don't need duration anymore for video! (As per your great decision)
      lecture = await Lecture.create({
        title,  
        type: "video",
        thumbnail, // YouTube mqdefault shortcut path sent from frontend
        videoId,   
        categoryId,
      });
      
    } else {
      return next(new AppError("Invalid lecture type specified", 400));
    }

    try {
      await Notification.create({
        mosqueId,
        message: `New lecture added: ${lecture.title}`,
        type: 'lecture',
        lectureId: lecture.id
      });
    }
    catch (error) {
      console.error("Error creating notification:", error);
    }

    // Now this block successfully accesses the 'lecture' variable!
    res.status(201).json({
      success: true,
      message: "Lecture saved successfully",
      lecture,
    });

  } catch (err) {
    console.error("Error saving lecture metadata:", err);  

    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Failed to save lecture metadata",
        500
      )
    )
  }
};



export const deleteLecture = async (req, res, next) => {
  try {
    const id = req.params.lectureId;

    if (!id) {
      return next(new AppError("Lecture id is required", 400));
    }

    const lecture = await Lecture.findByPk(id);

    if (!lecture) {
      return next(new AppError("Lecture not found", 404));
    }

    // 🔥 delete file from R2 (if exists)
    if (lecture.publicId) {
      try {
        await deleteFileFromR2(lecture.publicId);
      } catch (error) {
        return next(
          new AppError(
            process.env.NODE_ENV === "development"
              ? error.message
              : "Failed to delete lecture file from storage",
            500
          )
        );
      }
    }

    // ✅ delete lecture record
    await lecture.destroy();

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });

  } catch (err) {
    console.error("Delete lecture error:", err.message);

    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
        500
      )
    );
  }
};


export const getLectures = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) return next(new AppError("Category ID is required", 400));

    const category = await Category.findByPk(categoryId);
    if (!category) return next(new AppError("Category not found", 404));

    // 1. Added 'type' to destructuring
    let { userId, page = 1, limit = 10, search, type } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10; // Fixed from 2 back to 10
    const offset = (page - 1) * limit;

    // 2. Build the WHERE clause
    const whereClause = { categoryId };
    
    // Add Search logic
    if (search && search.trim() !== "") {
      whereClause.title = {
        [Op.like]: `%${search}%` 
      };
    }

    // 3. Add Type logic (video or audio)
    if (type && (type === 'video' || type === 'audio')) {
      whereClause.type = type;
    }

    const { rows: lectures, count } = await Lecture.findAndCountAll({
      where: whereClause, 
      distinct: true, 
      include: {
        model: Bookmark,
        as: 'bookmarks',
        where: userId ? { userId } : undefined,
        required: false, 
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]], 
    });

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      lectures,
    });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

export const getLectureCount = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        
        if (!categoryId) {
            return next(new AppError('category id is required', 400));
        }

        // Count only where categoryId matches
        const count = await Lecture.count({ 
            where: { categoryId } 
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (err) {
        console.error('Error fetching lecture count:', err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};