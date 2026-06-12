import cloudinary from "../config/claudinary.js";
import MosqueProfile from "../models/mosqueProfile.js";
import AppError from "../utils/AppError.js";
import dotenv from 'dotenv';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

export const updateMosqueProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { imageUrl, publicId } = req.body;
    const {mosqueId} = req.params;


    const mosqueProfile = await MosqueProfile.findOne({
      where: { mosqueId },
    });

    if (!mosqueProfile) {
      return next(
        new AppError("No profile found for this mosque", 404)
      );
    }

    // delete old image from cloudinary
  if (mosqueProfile.publicId) {
      try {
        await cloudinary.uploader.destroy(mosqueProfile.publicId);
      } catch (cloudErr) {
        console.error("CLOUDINARY_DELETE_ERROR:", cloudErr);
        // We continue even if image deletion fails, as the profile update is priority
      }
    }

    // update DB
    mosqueProfile.image = imageUrl;
    mosqueProfile.publicId = publicId;

    await mosqueProfile.save();

    return res.status(200).json({
      status: "success",
      message: "Mosque profile updated successfully",
      mosqueProfile: mosqueProfile.image,
    });
  } catch (err) {
     const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.query?.email && { email: req.query.email }) };
        console.error('UPDATE_MOSQUE_PROFILE_ERROR: Failed to update mosque profile', { context: errorContext, error: err });
        
    next(
      new AppError(
        isDev
          ? err.message
          : "Something went wrong while updating mosque profile",
        500
      )
    );
  }
};