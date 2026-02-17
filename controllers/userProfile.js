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

export const updateUserProfile = async(req, res, next) => {
    const transaction = await dbConnection.transaction();
    try{
        const userId = req.user.id;
        if(!req.file){
           await transaction.rollback();
            return next(new AppError('you not upload image to update try again', 400));
        };
            if (req.file.size > 5 * 1024 * 1024) {
                    await transaction.rollback();
                    return next(new AppError("Image too large. Max 5MB", 400));
            };

        cloudinary.uploader.upload_stream(
            {folder: 'user-profile-image'},
            async(err, result) => {
                if(err && !result){
                   await transaction.rollback();
                    return next(new AppError(process.env.NODE_ENV === 'development'
                        ? err.message : 'something went wrong while uploading image'
                    ));
                };
                const userProfile = await UserProfile.findOne({where: {userId}});
                if(!userProfile){
                   await transaction.rollback();
                    return next(new AppError('no user profile to update', 400));
                };
                const oldPublicId = userProfile.publicId;
                userProfile.image = result.secure_url;
                userProfile.publicId = result.public_id;
                await userProfile.save();

               if(oldPublicId){
                 await cloudinary.uploader.destroy(oldPublicId);
               }

                await transaction.commit();
                res.status(200).json({
                    status: 'success',
                    message: 'user profile updated successfully',
                    userProfile: userProfile.image
                });
            }
        );
    }
    catch(err){
       await transaction.rollback();
        next(new AppError(process.env.NODE_ENV === 'development' 
            ? err.message : 'some thing went wrong while fetching profile'
        ));
    }
}

