import User from "../models/user.js";
import userProfile from "../models/userProfile.js";
import AppError from "../utils/AppError.js"
import dotenv from 'dotenv';
dotenv.config();

export const getUserProfile = async(req, res, next) => {
    try{
        const userId = req.user.id;
      
        const profile = await userProfile.findOne({where: {userId}}, {
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
}