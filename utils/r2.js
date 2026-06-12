import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from '../config/s3.js'
import crypto from "crypto";
import AppError from "./AppError.js";
import dotenv from 'dotenv';
dotenv.config();


export const generateUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

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

// Quick sanitize: only keep alphanumeric, dots, and hyphens
const sanitizedFileName = fileName.replace(/[^a-z0-9.-]/gi, '_');
const key = `lectures/${uniqueId}/${crypto.randomUUID()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
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
