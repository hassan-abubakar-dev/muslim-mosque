import User from "../models/user.js";
import userProfile from "../models/userProfile.js";
import AppError from "../utils/AppError.js";

export const getLoggedInUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log('userId',userId);
        
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return next(new AppError('User not found', 404));
        }
        res.status(200).json({
            status: 'success',
            message: 'logged in user fetched successfully',
            user
        });
    } catch (err) {
        console.error(err);
        next(new AppError(process.env.NODE_ENV === 'development' 
            ? err.message : 'some thing went wrong try again'
        ));
    }
};