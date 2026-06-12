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

    const { imageUrl, publicId } = req.body;

    const userProfile = await UserProfile.findOne({
      where: { userId },
      transaction,
    });

    if (!userProfile) {
      await transaction.rollback();
      return next(new AppError("No user profile found", 404));
    }

    const oldPublicId = userProfile.publicId;

    // update DB
    userProfile.image = imageUrl;
    userProfile.publicId = publicId;

    await userProfile.save({ transaction });

    // delete old image from cloudinary
    if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId);
    }

    await transaction.commit();

    res.status(200).json({
      status: "success",
      message: "User profile updated successfully",
      userProfile: userProfile.image,
    });
  } catch (err) {
    await transaction.rollback();
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
    console.error('UPDATE_USER_PROFILE_ERROR: Failed to update user profile', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : "Something went wrong while updating profile", 500));
  }
};

