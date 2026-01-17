import User from "../models/user.js";
import VerificationCode from "../models/verificationCode.js";
import AppError from "../utils/AppError.js"
import dotenv from 'dotenv';
import generateToken from "../utils/token.js";
import userProfile from "../models/userProfile.js";
import dbConnection from "../config/db.js";
dotenv.config();
export const verifyNewUserAccount = async(req, res, next) => {
    const transaction = await dbConnection.transaction();
    
    try{
        const {verificationCode} = req.body;
        const isVerificationExist = await VerificationCode.findOne({where: {code: verificationCode}});
        if(!isVerificationExist){
            await transaction.rollback();
            return next(new AppError('sorry you not get verification code', 400));
        };

        const user = await User.findOne({where: {email: isVerificationExist.userEmail}});

        if(Date.now() > isVerificationExist.expiryTime){
            await VerificationCode.destroy({where: {code: verificationCode}}, { transaction });
            await transaction.rollback();
            return next(new AppError('your verification code has expired request new verification code', 400));
        };

        user.isVerified = true;
        await user.save({ transaction });
        await VerificationCode.destroy({where: {code: verificationCode}}, { transaction });

        const payload = {
            firstName: user.firstName,
            surName: user.surName,
            email: user.email,
            gender: user.gender,
            role: user.role

        };

        const accessToken = generateToken(payload, process.env.ACCESS_TOKEN_KEY, process.env.ACCESS_TOKEN_EXPERY);
        const refreshToken = generateToken(payload, process.env.REFRESH_TOKEN_KEY, process.env.REFRESH_TOKEN_EXPERY);

        const safeUser = {
            firstName: user.firstName,
            surName: user.surName,
            email: user.email,
            gender: user.gender,
            role: user.role
        };

    let profileImage;
    if(user.gender === 'male'){
        profileImage = process.env.MALE_AVATER_PROFILE;
    }else if(user.gender === 'female'){
        profileImage = process.env.FEMALE_AVATER_PROFILE;
    };

    const profile = await userProfile.create({
        image: profileImage,
        userId: user.id
    }, { transaction });

    await transaction.commit();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 
        })
        .status(200).json({
            status: 'success',
            message: 'your account has been verified successfully',
            accessToken,
            user: safeUser,
            profile: profile.image
        });
    }
    catch(err){
        await transaction.rollback();
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500));
    }
}