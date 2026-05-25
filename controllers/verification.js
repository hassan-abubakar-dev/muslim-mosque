import User from "../models/user.js";
import VerificationCode from "../models/verificationCode.js";
import AppError from "../utils/AppError.js";
import dotenv from 'dotenv';
import generateToken from "../utils/token.js";
import userProfile from "../models/userProfile.js";
import dbConnection from "../config/db.js";
dotenv.config();

/**
 * 1. VERIFY NEW USER ACCOUNT REGISTRATION
 * Validates signup token, activates the profile status, and logs them in immediately
 */
export const verifyNewUserAccount = async (req, res, next) => {    
    const transaction = await dbConnection.transaction(); 
    
    try {
        const { verificationCode } = req.body;

        // Find verification code within active transaction block
        const isVerificationExist = await VerificationCode.findOne({
            where: { code: verificationCode },
            transaction
        });

        if (!isVerificationExist) {
            await transaction.rollback();
            return next(new AppError('sorry you not get verification code', 400));
        }

        const user = await User.findOne({
            where: { email: isVerificationExist.userEmail },
            transaction
        });

        // 🛠️ FIX: If code is expired, delete it and COMMIT the clean state removal before exiting
        if (Date.now() > new Date(isVerificationExist.expiryTime).getTime()) {
            await VerificationCode.destroy({
                where: { code: verificationCode },
                transaction // ✅ Safely nested inside query options mapping
            });
            await transaction.commit();
            return next(new AppError('your verification code has expired request new verification code', 400));
        }

        // Activate user account flag
        user.isVerify = true; // Synced with your isVerify attribute schema naming standard
        await user.save({ transaction });

        // Burn validation token immediately
        await VerificationCode.destroy({
            where: { code: verificationCode },
            transaction // ✅ Safely nested inside query options mapping
        });

        // Pack response payloads
        const payload = {
            id: user.id,
            firstName: user.firstName,
            surName: user.surName,
            email: user.email,
            gender: user.gender,
            role: user.role,
            lastCheckedAt: user.lastCheckedAt
        };

        const accessToken = generateToken(payload, process.env.ACCESS_TOKEN_KEY, process.env.ACCESS_TOKEN_EXPERY);
        const refreshToken = generateToken(payload, process.env.REFRESH_TOKEN_KEY, process.env.REFRESH_TOKEN_EXPERY);

        const safeUser = {
            id: user.id,
            firstName: user.firstName,
            surName: user.surName,
            email: user.email,
            gender: user.gender,
            role: user.role
        };

        let profileImage;
        if (user?.gender === 'male') {
            profileImage = process.env.MALE_AVATER_PROFILE;
        } else if (user?.gender === 'female') {
            profileImage = process.env.FEMALE_AVATER_PROFILE;
        }

        // Initialize empty profile template asset matching registration hook specs
        const profile = await userProfile.create({
            image: profileImage,
            userId: user.id
        }, { transaction });

        // Safely lock down transaction state mutations
        await transaction.commit();

        return res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
    catch (err) {
        await transaction.rollback();
        console.error("VERIFY SIGNUP ERROR:", err.message);
        return next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500));
    }
};

/**
 * 2. VERIFY ACCOUNT RECOVERY CODE (PASSWORD RESET TRIGGER)
 * Validates token parameters without authenticating a full browser cookies login state session yet
 */


export const verifyRecoveryCode = async (req, res, next) => {
    const transaction = await dbConnection.transaction(); 
    
    try {
        const { verificationCode, email } = req.body;

        if (!verificationCode || !email) {
            await transaction.rollback();
            return next(new AppError('Please provide both verification code and email address', 400));
        }

        // Cross-examine matching code credentials targeting specific email pairing
        const isVerificationExist = await VerificationCode.findOne({
            where: { 
                code: verificationCode,
                userEmail: email 
            },
            transaction
        });

        if (!isVerificationExist) {
            await transaction.rollback();
            return next(new AppError('Invalid verification code or email pairing', 400));
        }

        // Process cleanup mechanics if the token timestamp dropped behind processing limits
        if (Date.now() > new Date(isVerificationExist.expiryTime).getTime()) {
            await VerificationCode.destroy({
                where: { code: verificationCode }, 
                transaction 
            });
            await transaction.commit(); 
            return next(new AppError('Your verification code has expired. Please request a new one.', 400));
        }

        const user = await User.findOne({ 
            where: { email: isVerificationExist.userEmail, isVerify: true },
            transaction
        });

        if (!user) {
            await transaction.rollback();
            return next(new AppError('The user matching this recovery session does not exist.', 404));
        }

        // Burn validation token immediately so it can never be processed twice
        await VerificationCode.destroy({
            where: { code: verificationCode }, 
            transaction 
        });

        // Commit database updates cleanly before generating the signature tokens
        await transaction.commit();

        // 🛡️ SECURITY ARCHITECTURE UPGRADE: 
        // Generate a highly restrictive, short-lived token to lock down the reset route
        const resetPayload = {
            id: user.id,
            email: user.email,
            purpose: "password_reset" // Isolated purpose so it can't double as a normal login token
        };

        const passwordResetToken = generateToken(resetPayload, process.env.PASSWORD_RESET_TOKEN_KEY, process.env.PASSWORD_RESET_TOKEN_EXPERY);

        // Return token securely to the client application pipeline
        return res.status(200).json({
            status: 'success',
            message: 'Verification code validated successfully. You may now proceed to reset your password.',
            email: user.email,
            resetToken: passwordResetToken // 🔑 Handing the secure gateway pass to your frontend!
        });
    }
    catch (err) {
        await transaction.rollback();
        console.error("VERIFY RECOVERY CODE ERROR:", err.message);
        return next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong', 500));
    }
};