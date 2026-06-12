import dbConnection from "../config/db.js";
import { FollowMosque, Mosque, MosqueAdmin, MosqueProfile, User, Category, Announcement, CategoryProfile } from "../models/relationship.js";
import performCategoryCleanup from "../service/category.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/claudinary.js";
import dotenv from "dotenv";
import { Op, fn, col, Sequelize } from "sequelize";
import getLikeOperator from "../utils/dbHelpers.js";

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';




export const registerMosque = async (req, res, next) => {
    const transaction = await dbConnection.transaction();
    
    try {
        const { name, country, state, localGovernment, description } = req.body;
        const userId = req.user.id;
        
        const existingMosque = await Mosque.findOne({
            where: { name, localGovernment }, 
            transaction 
        });

        if (existingMosque) {
            await transaction.rollback();
            return next(new AppError('You have already registered a mosque with this name in this local government area.', 400));
        }
        
        const newMosque = await Mosque.create({
            name, country, state, localGovernment, description, status: 'pending'
        }, { transaction });

        await MosqueAdmin.create({
            userId: userId,
            mosqueId: newMosque.id,
            role: 'owner'
        }, { transaction });

        await MosqueProfile.create({
            mosqueId: newMosque.id,
            image: process.env.MOSQUE_DEFAULT_IMAGE
        }, { transaction });

        await transaction.commit();

        // 🚀 NORMALIZE SCHEMA: Fetch with native associations
        const hydratedMosque = await Mosque.findByPk(newMosque.id, {
            attributes: {
                include: [
                    [
                        Sequelize.fn('COUNT', Sequelize.col('followers.id')),
                        'followersCount'
                    ]
                ]
            },
            include: [
                {
                    model: MosqueProfile,
                    as: "mosqueProfile",
                    attributes: ["image"],
                },
                {
                    model: FollowMosque,
                    as: "followers",
                    attributes: [],
                    duplicating: false
                }
            ],
            group: ['Mosque.id', 'mosqueProfile.id']
        });

        // Convert to plain object to inject the isFollowing flag
        const responseData = hydratedMosque.toJSON();
        responseData.isFollowing = 0; // Since it's a new mosque, they aren't following it yet
        responseData.followersCount = parseInt(responseData.followersCount) || 0;

        return res.status(201).json({
            status: 'success',
            message: 'Your mosque profile draft has been processed inside our tracking records.',
            mosque: responseData
        });
    }
    catch (err) { 
        if (transaction) await transaction.rollback();
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
        console.error('REGISTER_MOSQUE_ERROR:', { context: errorContext, error: err });
        return next(new AppError(isDev ? err.message : 'Something went wrong during mosque setup.', 500));
    }
};



export const getMosques = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const state = req.query.state;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const whereCondition = {};
    const OpLike = getLikeOperator(); // Ensure this helper is imported or defined
    
    if (search.trim()) whereCondition.name = { [OpLike]: `%${search.trim()}%` };
    if (state) whereCondition.state = state;

    const { rows: mosques, count } = await Mosque.findAndCountAll({
      where: whereCondition,
      attributes: {
        include: [
          [
            Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('followers.id'))),
            'followersCount'
          ]
        ]
      },
      include: [
        {
          model: MosqueProfile,
          as: "mosqueProfile",
          attributes: ["image"],
        },
        {
          model: FollowMosque,
          as: "followers",
          attributes: [], // We only want the count, not the join data
          duplicating: false // Essential to keep the main count accurate
        }
      ],
      // Grouping by primary ID ensures the COUNT applies to each mosque
      group: ['Mosque.id', 'mosqueProfile.id'],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      subQuery: false // Required for pagination to work correctly with joins
    });

    return res.status(200).json({
      status: "success",
      total: count.length, // count is an array when using group
      totalPages: Math.ceil(count.length / limit),
      mosques,
    });
  } catch (err) {
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
    console.error('GET_MOSQUES_ERROR:', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Something went wrong fetching mosques', 500));
  }
};



export const getMosque = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mosque = await Mosque.findByPk(id, {
      attributes: {
        include: [
          [
            // Using COUNT DISTINCT for accurate follower totals
            Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('followers.id'))),
            'followersCount'
          ]
        ]
      },
      include: [
        {
          model: MosqueProfile,
          as: 'mosqueProfile',
          attributes: ['id', 'image'] 
        },
        {
          model: FollowMosque,
          as: 'followers',
          attributes: [], // We only want the count, not the join data
          duplicating: false // Keeps the query efficient
        }
      ],
      // Grouping is mandatory when using aggregate functions
      group: ['Mosque.id', 'mosqueProfile.id']
    });

    if (!mosque) {
      return res.status(404).json({
        status: 'error',
        message: 'Mosque not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      mosque
    });
  } catch (err) {
    const errorContext = { 
        url: req.originalUrl, 
        method: req.method, 
        ip: req.ip, 
        ...(req.body?.email && { email: req.body.email }) 
    };
    console.error('GET_MOSQUE_ERROR: Failed to fetch mosque', { context: errorContext, error: err });
    
    next(new AppError(err.message || 'Something went wrong during fetch mosque', 500));
  }
};



export const getUserFollowedMosques = async (req, res, next) => {
  try {

    const userId = req.user.id;

    const followedMosques = await Mosque.findAll({
      attributes: {
        include: [
          [
            Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('followers.id'))),
            'followersCount'
          ]
        ]
      },
      include: [
        {
          model: FollowMosque,
          as: "followers", // Use the existing defined alias
          attributes: [],
          duplicating: false, // Required for COUNT to work correctly with joins
        },
        {
          model: MosqueProfile,
          as: "mosqueProfile",
          attributes: ["image"],
        },
      ],
      // We filter by checking for the existence of a follow record for this specific user
      where: Sequelize.where(
        Sequelize.col('followers.user_id'), 
        userId
      ),

      group: ['Mosque.id', 'mosqueProfile.id'],
      order: [["createdAt", "DESC"]],
    });

    // The frontend expects the same structure, so this remains unchanged
    const mosquesWithStatus = followedMosques.map(mosque => ({
        ...mosque.toJSON(),
        isFollowing: true 
    }));

    return res.status(200).json({
      status: "success",
      results: mosquesWithStatus.length,
      mosques: mosquesWithStatus
    });

  } catch (err) {
    next(new AppError(err.message, 500));
  }
};


export const getPendingMosques = async(req, res, next) => {

  try{

      const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    console.log('page, limit', page, limit)
    const offset = (page - 1) * limit;


    const pendingMosques = await Mosque.findAndCountAll({
      where: {status: 'pending'},
      include: {
        model: MosqueAdmin, as: 'mosquAdmin',
        include: {
          model: User, as: 'user',
          attributes: ['firstName', 'surName', 'email']
        }
      },
       limit: limit,
      offset: offset,
      order: [["createdAt", "ASC"]],
      distinct: true,
    })

    res.status(201).json({
      status: 'success',
      pendingMosques: pendingMosques.rows,
      totalCounts: pendingMosques.count
    });
  }
     catch(err){
      const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
      console.error('GET_PENDING_MOSQUES_ERROR: Failed to fetch pending mosques', { context: errorContext, error: err });
      next(new AppError(isDev ? err.message : 'Something went wrong during the pending mosque lookup process.'))
    }
};




export const getFollowedMosqueIds = async (req, res, next) => {
  try {

    const userId = req.user.id;

    // 2. Fetch only the mosque_ids for this user from the join table
    const followedIds = await FollowMosque.findAll({
      where: { userId },
      attributes: ["mosqueId"], // Only fetch the ID column
    });

    // 3. Map to a clean array of strings/numbers: [id1, id2, id3]
    const ids = followedIds.map((item) => String(item.mosqueId));

    // 4. Return the clean array
    return res.status(200).json({
      status: "success",
      followedMosqueIds: ids,
    });
  } catch (err) {
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
    console.error('GET_FOLLOWED_MOSQUE_IDS_ERROR: Failed to fetch followed mosque ids', { context: errorContext, error: err });
    return next(new AppError(isDev ? err.message : "Something went wrong while fetching your follow list.", 500));
  }
};

export const verifiedMosque = async (req, res, next) => {
    try {
        const { mosqueId } = req.params;
        
        const existingMosque = await Mosque.findOne({ where: { id: mosqueId, status: 'pending' } });
        
        // Added 'return' to stop execution if not found
        if (!existingMosque) {
            return next(new AppError('No mosque found with this ID', 404)); 
        }

        existingMosque.status = 'verified';
        
        // Added 'await' to ensure the database update finishes
        await existingMosque.save(); 

        res.status(200).json({
            status: 'success',
            message: `Mosque ${existingMosque.name} has been verified successfully`
        });
    } catch (err) {
      const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
      console.error('VERIFY_MOSQUE_ERROR: Failed to verify mosque', { context: errorContext, error: err });
      next(new AppError(isDev ? err.message : 'Something went wrong during the mosque verification process.', 500));
    }
};



export const getSuspendedMosques = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const data = await Mosque.findAndCountAll({
      where: { status: 'suspended' },
      limit: limit,
      offset: offset,
      order: [["updatedAt", "DESC"]],
      distinct: true,
    });

    res.status(200).json({
      status: 'success',
      suspendedMosques: data.rows, // Frontend looks for 'suspendedMosques'
      totalPages: Math.ceil(data.count / limit) // Frontend looks for 'totalPages'
    });
  } catch (err) {
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
    console.error('GET_SUSPENDED_MOSQUES_ERROR: Failed to fetch suspended mosques', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Something went wrong', 500));
  }
};

export const toggleSuspendAndUnsuspend = async (req, res, next) => {
    try {
        const { mosqueId } = req.params;

        const mosque = await Mosque.findByPk(mosqueId);
        
        if (!mosque) {
            return next(new AppError('No mosque found with this ID', 404));
        }

        // Toggle logic
        if (mosque.status === 'verified') {
            mosque.status = 'suspended';
        } else if (mosque.status === 'suspended') {
            mosque.status = 'verified';
        } else {
            // Optional: Handle if the mosque is in 'pending' status
            return next(new AppError('Only verified or suspended mosques can be toggled', 400));
        }

        await mosque.save();

        res.status(200).json({
            status: 'success',
            message: `Mosque ${mosque.name} is now ${mosque.status}` // Fixed variable here
        });
    } catch (err) {
      const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
      console.error('TOGGLE_SUSPEND_ERROR: Failed to toggle mosque suspend state', { context: errorContext, error: err });
      next(new AppError(isDev ? err.message : 'Update failed', 500));
    }
};





export const deleteMosque = async (req, res, next) => {
  const { id } = req.params;
  const transaction = await dbConnection.transaction();

  try {
    // 1. Fetch Mosque + Profile + Categories (Low cardinality)
    // Optimized: Only fetch specific fields
    const mosque = await Mosque.findByPk(id, {
      attributes: ['id'], 
      include: [
        { 
          model: MosqueProfile, 
          as: 'mosqueProfile', 
          attributes: ['publicId'] 
        },
        { 
          model: Category, 
          as: 'mosqueCategory',
          attributes: ['id'] 
        }
      ],
      transaction
    });

    if (!mosque) {
      await transaction.rollback();
      return next(new AppError("Mosque not found", 404));
    }

    // 2. Permission Guard: SuperAdmin OR Mosque Owner (via MosqueAdmin table)
    const isSuperAdmin = req.user.role === 'superAdmin';
    let isOwner = false;
    
    if (!isSuperAdmin) {
      const adminRecord = await MosqueAdmin.findOne({
        where: { mosqueId: id, userId: req.user.id, role: 'owner' },
        attributes: ['id'],
        transaction
      });
      if (adminRecord) isOwner = true;
    }

    if (!isSuperAdmin && !isOwner) {
      await transaction.rollback();
      return next(new AppError("Only the mosque owner or super admin can perform this action", 403));
    }

    // 3. CLEANUP ANNOUNCEMENTS (Hybrid Approach: Targeted/High-Cardinality Fetch)
    const announcements = await Announcement.findAll({
      where: { mosqueId: id },
      attributes: ['id', 'publicId'], 
      transaction
    });

    if (announcements.length > 0) {
      // Parallel file destruction
      await Promise.all(announcements.map(async (ann) => {
        if (ann.publicId) await cloudinary.uploader.destroy(ann.publicId);
      }));
      // Batch record destruction
      await Announcement.destroy({ 
        where: { id: announcements.map(a => a.id) }, 
        transaction 
      });
    }

    // 4. CLEANUP CATEGORIES (Using Service Layer)
    if (mosque.mosqueCategory?.length > 0) {
      for (const cat of mosque.mosqueCategory) {
        await performCategoryCleanup(cat.id, transaction);
      }
    }

    // 5. CLEANUP MOSQUE PROFILE (Cloudinary)
    if (mosque.mosqueProfile?.publicId) {
      await cloudinary.uploader.destroy(mosque.mosqueProfile.publicId);
      await MosqueProfile.destroy({ where: { mosqueId: id }, transaction });
    }

    // 6. FINAL DELETION (Mosque record)
    await mosque.destroy({ transaction });

    await transaction.commit();
    res.status(200).json({ success: true, message: "Mosque permanently deleted." });

  } catch (err) {
    if (transaction && !transaction.finished) await transaction.rollback();
    const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
    console.error('DELETE_MOSQUE_ERROR: Failed to delete mosque', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Failed to delete mosque', 500));
  }
};