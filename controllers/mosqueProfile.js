import cloudinary from "../config/claudinary.js";
import MosqueProfile from "../models/mosqueProfile.js";
import AppError from "../utils/AppError.js";

export const updateMosqueProfile = async(req, res, next) => {

    try{
        const userId = req.user.id;
        if(!req.file){
            return next(new AppError('you not upload image to update'));
        }

         if (req.file.size > 5 * 1024 * 1024) {
            return next(new AppError("Image too large. Max 5MB", 400));
    }
   
        cloudinary.uploader.upload_stream(
            {folder: 'mosque-profile-image'},
            async(err, result) => {
                if(err && !result){
                    return next(new AppError(process.env.NODE_ENV === 'development'
                        ? err.message : 'something went wrong while uploading image'
                    ));
                }
                const mosqueProfile = await MosqueProfile.findOne({where: {userId}});
                if(!mosqueProfile){
                    return next(new AppError('no profie for this mosque to update', 400));
                };
                const oldPublicId = mosqueProfile.publicId;
                if(oldPublicId){
                    cloudinary.uploader.destroy(oldPublicId);
                };
                mosqueProfile.image = result.secure_url;
                mosqueProfile.publicId = result.public_id;
                await mosqueProfile.save();

                res.status(200).json({
                    status: 'success',
                    message: 'mosque profile updated successfully',
                    mosqueProfile: mosqueProfile.image
                });
            }
        )
    }
    catch(err){
        next(new AppError(process.env.NODE_ENV === 'development' 
            ? err.message : 'some thing went wrong while updating mosque profile try again'
        ));
    }
}