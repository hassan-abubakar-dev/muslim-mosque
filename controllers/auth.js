import bcrypt from "bcryptjs";
import User from "../models/user.js";
import AppError from "../utils/AppError.js"
import dotenv from 'dotenv';
import generateToken from "../utils/token.js";
import sendEmail from "../config/email.js";
import generateVerificationCode from "../utils/verificationCode.js";
import VerificationCode from "../models/verificationCode.js";
import generateExpiryTime from "../utils/experyTime.js";
import dbConnection from "../config/db.js";
import jwt from 'jsonwebtoken';
dotenv.config();

export const registerUser = async(req, res, next) => {
    const transaction = await dbConnection.transaction();
    
    try{
        const {firstName, surName, email, password, gender} = req.body;
        const existingUser = await User.findOne({where: {email}});

        if(existingUser){
            await transaction.rollback();
            return next(new AppError('user already exits use different email', 400));
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            firstName,
            surName,
            email,
            password: hashedPassword,
            gender
        }, { transaction });


        
    const verificationCode = generateVerificationCode();
    const expiryTime = generateExpiryTime();
    await VerificationCode.create({
        code: verificationCode,
        expiryTime,
        userEmail: email
    }, { transaction })

    const html = `
      <h2>Welcome to Muslim Mosque</h2>
      <p>Hello ${firstName},</p>
      <p>Your verification code is:</p>
      <h3>${verificationCode}</h3>
      <p>If you did not sign up, ignore this email.</p>
    `;

    await sendEmail({
      to: email,
      subject: 'Verify your email - Muslim Mosque',
      html,
    });

    await transaction.commit();

        res.status(201).json({
            status: 'success',
            message: `email sended to ${email}`
        });
    }
    catch(err){
        await transaction.rollback();
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500))
    }
}

export const loginUser = async(req, res, next) => {
    try{
        const {email, password} = req.body;
        const existingUser = await User.findOne({where: {email}});
        if(!existingUser){
            return next(new AppError('sorry you not create an accout', 400));
        }; 

        const isPasswordValid =  await  bcrypt.compare(password, existingUser.password);
        if(!isPasswordValid){
            return next(new AppError('incorrect password', 400));
        }
        const payload = {
            id: existingUser.id,
            fullName: existingUser.fullName,
            email: existingUser.email, 
            role: existingUser.role,
            gender: existingUser.gender
        };
        const accessToken = generateToken(
            payload, 
            process.env.ACCESS_TOKEN_KEY, 
            process.env.ACCESS_TOKEN_EXPERY
        );
          const refreshToken = generateToken(
            payload, 
            process.env.REFRESH_TOKEN_KEY, 
            process.env.REFRESH_TOKEN_EXPERY
        );


        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 
        }).status(200).json({
            status: 'success',
            message: `welcome back ${existingUser.firstName}`,
            accessToken,
            user: payload
        })
           
    }catch(err){
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500))
    }
};

export const requestNewAccessToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken

console.log('refreshToken', refreshToken); 

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, decode) => {
            if (err) {
                return next(new AppError('invalid or expire refresh token', 401));
            }

            const payload = {
                id: decode.id,
                firstName: decode.firstName,
                surName: decode.surName,
                email: decode.email,
                gender: decode.gender,
                role: decode.role
            };
            const newAccessToken = generateToken(
                payload,
                process.env.ACCESS_TOKEN_KEY,
                process.env.ACCESS_TOKEN_EXPERY
            );

            res.status(201).json({
                status: 'success',
                message: 'new access token was generated successfully',
                accessToken: newAccessToken
            });
        });
    }
    catch (error) {
        console.error(error);
        next(new AppError(error.message, 500));
    };
};
export const protectRoutes = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('Not logged in or invalid token', 401));
        }

        const token = authHeader.split(' ')[1].trim();

        // Synchronous verify
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);

        req.user = decoded; 
        
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Token expired', 401));
        }
        return next(new AppError('Invalid token', 401));
    }
};

export const logOutUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken; //from cookies perser 
        if (!refreshToken) {
            return next(new AppError('no refresh token availble you are already logout', 400));
        }

        res.clearCookie('refreshToken',
            {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 
            }
        );

        res.status(200).json({
            status: 'success',
            message: 'refreshToken deleted successfully'
        });
    }
    catch (err) {
        console.error(err);
        next(new AppError(process.env.NODE_ENV === 'development'
                ? err.message : 'something went wrong', 400));
    };
};