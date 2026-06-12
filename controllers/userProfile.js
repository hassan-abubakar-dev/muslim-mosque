import AppError from "../utils/AppError.js"
import dotenv from 'dotenv';
import UserProfile from "../models/userProfile.js";
import dbConnection from "../config/db.js";
import cloudinary from "../config/claudinary.js";
dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

export const getUserProfile = async(req, res, next) => {
    try{
        const userId = req.user.id;
      
        const profile = await UserProfile.findOne({where: {userId}}, {
            attributes: ['image']
        });
        
        res.status(200).json({
            status: 'success',
            message: 'user profile fetched successfully',
            userProfile: profile
        });
    }
    catch(err){
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
        console.error('GET_USER_PROFILE_ERROR: Failed to fetch user profile', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'some thing went wrong while fetching profile', 500));
    }
};

export const updateUserProfile = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const userId = req.user.id;
    const { imageUrl, publicId, metadata } = req.body;

    // 1. Validation
    if (!metadata || metadata.size > 500000 || !metadata.type.startsWith('image/')) {
      await cloudinary.uploader.destroy(publicId).catch(console.error);
      return next(new AppError("Invalid image constraints.", 400));
    }

    // 2. Fetch record
    const userProfile = await UserProfile.findOne({
      where: { userId },
      transaction,
    });

    if (!userProfile) {
      await cloudinary.uploader.destroy(publicId).catch(console.error);
      await transaction.rollback();
      return next(new AppError("No user profile found", 404));
    }

    const oldPublicId = userProfile.publicId;

    // 3. Update DB
    userProfile.image = imageUrl;
    userProfile.publicId = publicId;
    await userProfile.save({ transaction });

    // 4. Commit changes
    await transaction.commit();

    // 5. Cleanup OLD image (non-blocking)
    if (oldPublicId && oldPublicId !== publicId) {
      cloudinary.uploader.destroy(oldPublicId).catch(console.error);
    }

    res.status(200).json({ status: "success", userProfile: userProfile.image });

  } catch (err) {

    // 6. THE JANITOR: Clean up NEW image on failure
    if (req.body.publicId) {
      await cloudinary.uploader.destroy(req.body.publicId).catch(console.error);
    }
const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
    console.error('UPDATE_USER_PROFILE_ERROR: Failed to update user profile', { context: errorContext, error: err });
    
    if (transaction) await transaction.rollback();
    next(new AppError(isDev ? err.message : "Update failed", 500));
  }
};

