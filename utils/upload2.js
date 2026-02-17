import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { r2Client } from "../config/r2Client.js";

// Generate a unique filename
const generateFileName = (originalName) => {
  const ext = originalName.split(".").pop();
  const unique = crypto.randomBytes(16).toString("hex");
  return `${unique}.${ext}`;
};

/**
 * Upload file to R2
 * @param {Object} file - multer file object
 * @param {string} [oldKey] - optional: delete old file first
 * @returns { key, url }
 */
const uploadToR2 = async (file, oldKey) => {
  // Delete old file if provided
  if (oldKey) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: oldKey,
    });
    await r2Client.send(deleteCommand);
  }

  // Upload new file
  const fileName = generateFileName(file.originalname);

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(uploadCommand);

  return {
    key: fileName,
    url: `${process.env.R2_ENDPOINT}/${fileName}`,
  };
};

export default uploadToR2;