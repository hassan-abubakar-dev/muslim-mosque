import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js"
import dotenv from 'dotenv';
import generateToken from "../utils/token.js";
import generateVerificationCode from "../utils/verificationCode.js";
import VerificationCode from "../models/verificationCode.js";
import {User } from '../models/relationship.js'
import generateExpiryTime from "../utils/experyTime.js";
import dbConnection from "../config/db.js";
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
dotenv.config();

export const registerUser = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { firstName, surName, email, password, gender } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      await transaction.rollback();
      return next(new AppError("User already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create(
      { firstName, surName, email, password: hashedPassword, gender },
      { transaction }
    );

    const verificationCode = generateVerificationCode();
    const expiryTime = generateExpiryTime();

    await VerificationCode.create(
      {
        code: verificationCode,
        expiryTime,
        userEmail: email,
      },
      { transaction }
    );

    const html = `
      <h2>Welcome to Muslim Mosque</h2>
      <p>Hello ${firstName},</p>
      <p>Your verification code is:</p>
      <h3>${verificationCode}</h3>
    `;

    // 🚨 IMPORTANT: EMAIL MUST FAIL → THROW ERROR
    await sendEmail({
      to: email,
      subject: "Verify your account",
      html,
    });

    // only commit if email succeeds
    await transaction.commit();

    return res.status(201).json({
      status: "success",
      message: `Email sent to ${email}`,
    });

  } catch (err) {
    await transaction.rollback();

    console.error("REGISTER ERROR:", err.message);

    return next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
        500
      )
    );
  }
};

export const requestNewVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // delete old codes
    await VerificationCode.destroy({ where: { userEmail: email } });

    const verificationCode = generateVerificationCode();
    const expiryTime = generateExpiryTime();

    await VerificationCode.create({
      code: verificationCode,
      expiryTime,
      userEmail: email,
    });

    const html = `
      <h2>Muslim Mosque</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your verification code is:</p>
      <h3>${verificationCode}</h3>
      <p>This code expires in 10 minutes.</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Verification Code",
        html,
      });
    } catch (emailErr) {
      // rollback verification code if email fails
      await VerificationCode.destroy({ where: { userEmail: email } });

      return next(new AppError("Failed to send email. Try again.", 500));
    }

    res.status(200).json({
      status: "success",
      message: `Check your email, ${user.firstName}`,
    });

  } catch (error) {
    console.error(error);
    next(new AppError(error.message, 500));
  }
};;

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



export const changeUserPassword = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Populated by your auth middleware guard

    // 1. Fetch user from database including the password column explicitly
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      await transaction.rollback();
      return next(new AppError("User account record not found", 404));
    }

    // 2. Verify if the provided current password matches what is in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      await transaction.rollback();
      return next(new AppError("The current password you entered is incorrect", 401));
    }

    // 3. Optional Security Guard: Prevent resetting to the exact same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      await transaction.rollback();
      return next(new AppError("New password cannot be the same as your current password", 400));
    }

    // 4. Hash the new password with the same standard salt factor (12) used in registration
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 5. Update user model instance variables and save modifications
    user.password = hashedNewPassword;
    await user.save({ transaction });

    // 6. Commit database transaction changes securely
    await transaction.commit();

    return res.status(200).json({
      status: "success",
      message: "Your password has been securely reset!",
    });

  } catch (err) {
    await transaction.rollback();
    console.error("CHANGE PASSWORD ERROR:", err.message);

    return next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "An error occurred while updating security records",
        500
      )
    );
  }
};


export const forgotPassword = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    const { email } = req.body;

    if (!email) {
      await transaction.rollback();
      return next(new AppError("Please provide an email address", 400));
    }

    // 1. Audit check: Ensure user exists AND is fully verified/activated
    const user = await User.findOne({ 
      where: { 
        email, 
        isVerify: true // 🛡️ Your excellent security guardrail stays right here!
      } 
    });

    // 🔒 Defensive Security: If the user doesn't exist or isn't verified, we fake a success!
    // This stops hackers from scraping your user list while keeping the system clean.
    if (!user) {
      await transaction.rollback(); // Close the transaction cleanly
      return res.status(200).json({
        status: "success",
        message: `If an account exists for ${email}, a recovery code has been securely routed.`,
      });
    }

    // 2. Generate new recovery parameters
    const recoveryCode = generateVerificationCode();
    const expiryTime = generateExpiryTime();

    // 3. 🛠️ FIX: Clean up stale/old tokens safely passing options block transaction context
    await VerificationCode.destroy({
      where: { userEmail: email },
      transaction: transaction // ✅ Correctly nested in options object mapping
    });

    // 4. Record the new code token row cleanly inside the transaction
    await VerificationCode.create(
      {
        code: recoveryCode,
        expiryTime,
        userEmail: email,
      },
      { transaction }
    );

    // 5. Build presentation template layout parameters
    const html = `
      <h2>Masjiba Account Recovery</h2>
      <p>Hello ${user.firstName},</p>
      <p>We received a request to reset your password account routing parameters.</p>
      <p>Your secure verification code is:</p>
      <h3 style="font-size: 24px; letter-spacing: 2px; color: #065f46;">${recoveryCode}</h3>
      <p>This code is highly sensitive and will expire in exactly 15 minutes.</p>
      <p>If you did not initiate this recovery request, please disregard this automated email.</p>
    `;

    // 6. TRANSACTION SAFE-GUARD: Dispatched email execution parameter
    await sendEmail({
      to: email,
      subject: "Reset your Masjiba Account Password",
      html,
    });

    // 7. Commit state changes safely only if everything succeeds
    await transaction.commit();

    return res.status(200).json({
      status: "success",
      message: `If an account exists for ${email}, a recovery code has been securely routed.`,
    });

  } catch (err) {
    // Revert all structural database state mutations if an exception drops out of flight
    await transaction.rollback();

    console.error("FORGOT PASSWORD ERROR:", err.message);

    return next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong inside our messaging routing hub",
        500
      )
    );
  }
};


export const resetPassword = async (req, res, next) => {
    // 1. Establish an isolated database transaction pool
    const transaction = await dbConnection.transaction();

    try {
        const { password, token } = req.body;

        // 2. Structural Content Check
        if (!password || !token) {
            await transaction.rollback();
            return next(new AppError("Missing new password payload or reset authorization token.", 400));
        }

        // 3. Cryptographic Token Validation Check
        let decoded;
        try {
            // 🛡️ Decodes using your exact dedicated password reset secret key configuration
            decoded = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_KEY);
        } catch (jwtErr) {
            await transaction.rollback();
            return next(new AppError("Your reset session has expired or is invalid. Please request a new code.", 401));
        }

        // 4. Strict Scope/Intent Validation Guardrail
        // Confirms this is genuinely a reset token and not a standard stolen access/refresh token
        if (decoded.purpose !== "password_reset") {
            await transaction.rollback();
            return next(new AppError("Invalid token purpose authorization mapping.", 403));
        }

        // 5. Extract target account instance within the active transaction context
        const user = await User.findOne({ 
            where: { 
                id: decoded.id, 
                email: decoded.email, 
                isVerify: true // Ensures only active, verified accounts can undergo password changes
            },
            transaction
        });

        if (!user) {
            await transaction.rollback();
            return next(new AppError("The user account matching this recovery session could not be found.", 404));
        }

        // 6. Securely hash the incoming new raw text password string
        // 12 salt rounds balancing server CPU protection against brute-force resistance
        const hashedPassword = await bcrypt.hash(password, 12);

        // 7. Update model properties and record state updates directly
        user.password = hashedPassword;
        await user.save({ transaction });

        // 8. Safely commit all structural changes to the database engine
        await transaction.commit();

        // 9. Return absolute confirmation to the frontend client application
        return res.status(200).json({
            status: "success",
            message: "Your Masjiba account password has been updated successfully."
        });

    } catch (err) {
        // Safe database transaction fallback recovery path
        await transaction.rollback();
        console.error("RESET PASSWORD CONTROLLER ERROR:", err.message);
        return next(
            new AppError(
                process.env.NODE_ENV === "development" ? err.message : "Something went wrong resetting your password.", 
                500
            )
        );
    }
};