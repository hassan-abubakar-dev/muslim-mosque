import AppError from "../utils/AppError.js";
import { User, UserProfile, Mosque } from '../models/relationship.js'; // Adjust paths to your models
import dbConnection from "../config/db.js";
import { Op } from 'sequelize';

import dotenv from 'dotenv';

dotenv.config();


export const getLoggedInUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log('userId', userId);
        
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            logging: console.log, // Enable logging for this query
            include: [
                {
                    model: Mosque,
                    as: "managedMosques", 
                    attributes: ['id', 'name'], 
                    through: { 
                        attributes: ['role'] 
                    }
                }
            ]
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


export const searchUserByEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const currentUserId = req.user.id; // Extract logged-in admin ID from auth middleware

        if (!email) {
            return next(new AppError('Please provide an explicit email address to search.', 400));
        }

        const targetEmail = email.toLowerCase().trim();

        // 🛑 ISSUE 2 FIX: Prevent admin from searching or adding themselves
        if (req.user.email?.toLowerCase().trim() === targetEmail) {
            return next(new AppError('You cannot search for or add yourself to your own mosque management team.', 400));
        }

        // 🖼️ ISSUE 1 FIX: Include Profile model to pull the secure user image data structure
        const user = await User.findOne({
            where: { email: targetEmail },
            attributes: ['id', 'firstName', 'surName', 'email'],
            include: [
                {
                    model: UserProfile,
                   as: 'userProfile',
                    attributes: ['image'] 
                }
            ]
        });

        // Double check safety if they use a different email but the ID turns out to be theirs
        if (user && user.id === currentUserId) {
            return next(new AppError('You cannot add yourself to your own mosque management team.', 400));
        }

        // If no record exists, send a clean 404 error handled by your frontend error message banner
        if (!user) {
            return next(new AppError('No user found with that email address. Make sure they have registered first.', 404));
        }

        // Return JSON structured to match your application's data workflows
        res.status(200).json({
            status: 'success',
            message: 'User identity matched successfully',
            data: {
                user
            }
        });

    } catch (err) {
        console.error('Email search error:', err);
        next(new AppError(
            process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'Something went wrong during the user lookup process.'
        ));
    }
};



export const updateUserInfo = async (req, res, next) => {
  const transaction = await dbConnection.transaction();

  try {
    // 1. Destructure fields from request body (matching frontend updates to come)
    const { firstName, surName, gender } = req.body;
    
    // 2. req.user should be populated by your protected route auth middleware
    const userId = req.user.id; 

    // 3. Fetch user and profile records within the transaction scope
    const user = await User.findByPk(userId, { transaction });
    const profile = await UserProfile.findOne({ where: { userId }, transaction });

    if (!user || !profile) {
      await transaction.rollback();
      return next(new AppError("User account profile records not found", 404));
    }

    // 4. Handle Conditional Default Avatar Swapping Logic
    if (gender && gender !== user.gender) {
      const currentImage = profile.image;
      const maleDefault = process.env.MALE_AVATER_PROFILE;
      const femaleDefault = process.env.FEMALE_AVATER_PROFILE;

      // Swap placeholder if and only if they haven't uploaded a custom photo
      if (currentImage === maleDefault || currentImage === femaleDefault) {
        if (gender === 'male') {
          profile.image = maleDefault;
        } else if (gender === 'female') {
          profile.image = femaleDefault;
        }
        await profile.save({ transaction });
      }
    }

    // 5. Apply basic text validations and save identity updates
    if (firstName) user.firstName = firstName;
    if (surName) user.surName = surName;
    if (gender) user.gender = gender;

    await user.save({ transaction });

    // 6. Commit database pipeline transformations
    await transaction.commit();

    // 7. Compile updated clean payload objects
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      surName: user.surName,
      email: user.email,
      gender: user.gender,
      role: user.role
    };

    return res.status(200).json({
      status: "success",
      message: "Profile credentials updated successfully",
      user: safeUser,
      profile: profile.image // Sends back the updated or existing image URL
    });

  } catch (err) {
    await transaction.rollback();
    console.error("UPDATE INFO ERROR:", err.message);

    return next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong while saving adjustments",
        500
      )
    );
  }
};


// new functions for super admin
export const getUserCounts = async (req, res, next) => {
    try {
        // Run queries in parallel for better performance
        const [totalActiveUsers, totalInActiveUsers, totalAgents] = await Promise.all([
            User.count({ where: { isVerify: true } }),
            User.count({ where: { isVerify: false } }),
            User.count({ where: { isVerify: true, role: 'agent' } })
        ]);

        // Use 200 for successful data retrieval
        return res.status(200).json({
            status: 'success',
            usersCounts: {
                totalActiveUsers,
                totalInActiveUsers,
                totalAgents
            }
        });
    } catch (err) {
        // Log the full error in development for better debugging
        if (process.env.NODE_ENV === 'development') {
            console.error(err); 
        }
        
        return next(new AppError(
            process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'Something went wrong during the user lookup process.',
            500
        ));
    }
};

export const getAllVerifiedUsers = async (req, res, next) => {
    try {
        // 1. Extract pagination and search params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search; // Optional: ?search=John
        console.log('Pagination params - page:', page, 'limit:', limit, 'search:', searchTerm);

        // 2. Build filter conditions
        const whereClause = {
            isVerify: true // Only verified users
        };

        // If search term is provided, check name or email
      if (searchTerm) {
    whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${searchTerm}%` } }, 
        { surName: { [Op.like]: `%${searchTerm}%` } },  
        { email: { [Op.like]: `%${searchTerm}%` } }     
    ];
}

        // 3. Fetch data with count for frontend pagination
        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'firstName', 'surName', 'email', 'role', 'isVerify'], 
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        // 4. Return response
        return res.status(200).json({
            status: 'success',
            results: users.length,
            totalUsers: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            users
        });

    } catch (err) {
        console.error('Fetch all users error:', err);
        return next(new AppError(
            process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'Failed to retrieve user directory.',
            500
        ));
    }
};


