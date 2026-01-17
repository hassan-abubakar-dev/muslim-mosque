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
        const payload = {
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

        res.cookies('refreshToken', refreshToken).status(200).json({
            status: 'success',
            message: `welcome back ${existingUser.fullName}`,
            accessToken
        })
        
    }catch(err){
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500))
    }
};

export const requestNewAccessToken = (req, res, next) => {
    try{
        const {refreshToken} = req.cookies;
        if(!refreshToken){
            next(new AppError('no refreshToken', 400));
        }
        res.clearCookies(refreshToken);
    }
    catch(err){
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' ? err.message : 'something went wrong', 500))
    }
}