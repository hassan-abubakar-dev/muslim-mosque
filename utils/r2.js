import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from '../config/s3.js'
import crypto from "crypto";
import AppError from "./AppError.js";
import dotenv from 'dotenv';
dotenv.config();


export const generateUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return next(new AppError("Missing file info", 400));
    }

    // 🔥 ALLOWED TYPES
    const allowedTypes = ["audio/", "image/"];

    const isAllowed = allowedTypes.some(type =>
      fileType.startsWith(type)
    );

    if (!isAllowed) {
      return next(
        new AppError("Only audio and image files are allowed", 400)
      );
    }

    // 🔥 OPTIONAL: restrict specific formats (stronger security)
    const allowedMimeTypes = [
      "audio/mpeg",   // mp3
      "audio/wav",
      "audio/ogg",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedMimeTypes.includes(fileType)) {
      return next(
        new AppError("Unsupported file format", 400)
      );
    }

    const uniqueId = crypto.randomUUID();

    const key = `lectures/${uniqueId}/${crypto.randomUUID()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300, // 5 minutes
    });

    return res.json({
      uploadUrl,
      key,
    });

  } catch (err) {
    console.error(err);
    next(new AppError(err.message, 500));
  }
};


export const deleteFileFromR2 = async (key) => {
  try {
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);

    console.log("✅ File deleted from R2:", key);
  } catch (error) {
    console.error("❌ R2 delete error:", error.message);
    throw error;
  }
};


export const getLectures = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    // optional filter by category
    const whereClause = categoryId ? { categoryId } : {};

    const { rows: lectures, count: totalItems } = await Lecture.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      totalItems,
      pageSize: limit,
      lectures,
    });

  } catch (err) {
    console.error("Get lectures error:", err.message);

    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Failed to fetch lectures",
        500
      )
    );
  }
};