import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "../config/r2Client.js";
import Lecture from "../models/Lecture.js"; 
import Mosque from "../models/Mosque.js";
import AppError from "../utils/AppError.js";


// 1️⃣ Generate presigned PUT URL for lecture upload
export const generateLectureUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, type, mosqueId } = req.body;

    // Validate type
    if (!["audio", "video"].includes(type)) {
      return next(new AppError('Invalid lecture type. Must be "audio" or "video".', 400));
    }

    // Validate mosque exists (optional)
    const {categoryId} = req.params;
    if (!categoryId){
        next(new AppError('category id is required', 400));
    }

    // Generate unique key for R2
    const key = `lectures/${type}/${Date.now()}-${fileName}`;

    // Generate presigned PUT URL (expires in 1 hour)
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    res.status(200).json({ uploadUrl, key });
  } catch (err) {
    console.error(err);
    next(new AppError("Failed to generate upload URL", 500));
  }
};

// 2️⃣ Save lecture metadata after successful upload
export const saveLectureMetadata = async (req, res, next) => {
  try {
    const { title, type, key, duration } = req.body;
    const {categoryId} = req.params;
    if(!categoryId){    
        return next(new AppError('category id is required', 400));
    };

    if (!title || !key || !type || !duration) {
      return next(new AppError("Missing required fields", 400));
    }

    const lecture = await Lecture.create({
      title,
      type,
      fileKey: key,
      duration,
      categoryId
    });

    res.json({ message: "Lecture saved", lecture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save lecture metadata" });
  }
};

// 3️⃣ Generate signed GET URL for playback
export const getLecturePlaybackUrl = async (req, res, next) => {
  try {
    const lectureId = req.params.id;

    const lecture = await Lecture.findByPk(lectureId);
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });

    // Optional: check user access (mosque, premium)
    // Example: if (lecture.isPremium && !req.user.isPremium) return res.status(403).json({message: 'Access denied'})

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: lecture.fileKey,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 7200 }); // 2 hours
    res.json({ signedUrl });
  } catch (err) {
    console.error(err);
    next(new AppError(err.message, 500))
  }
};

export const getAllLectures = async (req, res, next) => {
  try {
    const {categoryId} = req.params; // or categoryId if needed
    const lectures = await Lecture.findAll({
      where: { categoryId }, // adjust to your schema
      order: [['createdAt', 'DESC']] // newest first
    });

    // Return metadata only, no signed URL yet
    res.status(200).json({ lectures });
  } catch (err) {
    console.error(err);
     next(new AppError(err.message, 500))
  }
};