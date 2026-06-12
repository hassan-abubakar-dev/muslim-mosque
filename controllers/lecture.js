
import AppError from "../utils/AppError.js";
import { deleteFileFromR2 } from "../utils/r2.js";
import dotenv from "dotenv";
import { Lecture, Category, Notification, Bookmark } from "../models/relationship.js";
import { Op } from "sequelize";
import getLikeOperator from "../utils/dbHelpers.js";

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';


// Save lecture metadata to database
export const saveLectureMetadata = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { title, type, key, duration, url, thumbnail, videoId, mosqueId, metadata } = req.body;
  
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
      };

     const headCommand = new HeadObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });
  const r2Data = await s3.send(headCommand);

  // 2. Validate integrity (Compare R2 size with client-sent metadata size)
  if (r2Data.ContentLength !== metadata.size) {
    await deleteFileFromR2(key);
    return next(new AppError("File integrity check failed (size mismatch)", 400));
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
    if(req.body.key){
      deleteFileFromR2(req.body.key);
    }
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('SAVE_LECTURE_METADATA_ERROR: Failed to save lecture metadata', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Failed to save lecture metadata', 500));
  }
};



export const deleteLecture = async (req, res, next) => {
  try {
    const id = req.params.lectureId;

    const lecture = await Lecture.findByPk(id);

    if (!lecture) {
      return next(new AppError("Lecture not found", 404));
    }

    // 🔥 delete file from R2 (if exists)
    if (lecture.publicId) {
      try {
        await deleteFileFromR2(lecture.publicId);
      } catch (error) {
        const errorContext = {
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
        };
        console.error('DELETE_LECTURE_FILE_ERROR: Failed to delete lecture file from storage', { context: errorContext, error });
        return next(new AppError(isDev ? error.message : 'Failed to delete lecture file from storage', 500));
      }
    }

    // ✅ delete lecture record
    await lecture.destroy();

    res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });

  } catch (err) {
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('DELETE_LECTURE_ERROR: Failed to delete lecture', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Something went wrong', 500));
  }
};


export const getLectures = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findByPk(categoryId);
    if (!category) return next(new AppError("Category not found", 404));

    // 1. Added 'type' to destructuring
    let { userId, page = 1, limit = 10, search, type } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // 2. Build the WHERE clause
    const whereClause = { categoryId };
    
    // Add Search logic
    if (search && search.trim() !== "") {
      const OpLike = getLikeOperator();
      whereClause.title = {
        [OpLike]: `%${search}%` 
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
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('GET_LECTURES_ERROR: Failed to fetch lectures', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Something went wrong', 500));
  }
};

export const getLectureCount = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        

        // Count only where categoryId matches
        const count = await Lecture.count({ 
            where: { categoryId } 
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (err) {
      const errorContext = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      };
      console.error('GET_LECTURE_COUNT_ERROR: Failed to fetch lecture count', { context: errorContext, error: err });
      next(new AppError(isDev ? err.message : 'Something went wrong', 500));
    }
};