import AppError from "../utils/AppError.js"
import dotenv from 'dotenv';
import UserProfile from "../models/userProfile.js";
import dbConnection from "../config/db.js";
import cloudinary from "../config/claudinary.js";
dotenv.config();

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
        next(new AppError(process.env.NODE_ENV === 'development' 
            ? err.message : 'some thing went wrong while fetching profile'
        ));
    }
};

export const updateUserProfile = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const userId = req.user.id;

    const { imageUrl, publicId } = req.body;

    if (!imageUrl || !publicId) {
      await transaction.rollback();
      return next(new AppError("Image URL and publicId are required", 400));
    }

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

    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong while updating profile",
        500
      )
    );
  }
};

