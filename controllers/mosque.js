import dbConnection from "../config/db.js";
import { FollowMosque, Mosque, MosqueAdmin, MosqueProfile, User, Category, Announcement, CategoryProfile } from "../models/relationship.js";
import performCategoryCleanup from "../service/category.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/claudinary.js";
import dotenv from "dotenv";
import { Op, fn, col, literal } from "sequelize";

dotenv.config();



export const registerMosque = async (req, res, next) => {
    const transaction = await dbConnection.transaction();
    
    try {
        const { name, country, state, localGovernment, description } = req.body;
        const userId = req.user.id;
        
        // 1. Check for existing identical mosque registration matching parameters
        const existingMosque = await Mosque.findOne({
            where: { name, localGovernment }, 
            transaction 
        });

        if (existingMosque) {
            await transaction.rollback();
            return next(new AppError('You have already registered a mosque with this name in this local government area.', 400));
        }
        
        // 2. Provision core Mosque entity record entry
        const newMosque = await Mosque.create({
            name,
            country,
            state,
            localGovernment,
            description,
            status: 'pending'
        }, { transaction });

        // 3. Bind submitting user as owner admin inside the tracking matrix table
        await MosqueAdmin.create({
            userId: userId,
            mosqueId: newMosque.id,
            role: 'owner'
        }, { transaction });

        // 4. Instantiate default profile row template placeholder asset
        await MosqueProfile.create({
            mosqueId: newMosque.id,
            image: process.env.MOSQUE_DEFAULT_IMAGE
        }, { transaction });

        // 5. Commit all structural record updates safely to save progress
        await transaction.commit();

        // 6. 🚀 NORMALIZE SCHEMA RESPONSE DATA: Re-query the database for the complete hydrated object layout
        const fullyHydratedMosque = await Mosque.findOne({
            where: { id: newMosque.id },
            attributes: {
                include: [
                    // 📊 Fallback calculations match getMosques specifications exactly
                    [
                        literal(`(
                            SELECT COUNT(*)
                            FROM followmosques AS followMosques
                            WHERE followMosques.mosque_id = Mosque.id
                        )`),
                        "followersCount",
                    ],
                    // ✅ 🛠️ FIXED HERE: Wrapped variable payload string within explicit single quotes to parse string UUID paths cleanly
                    [
                        literal(`(
                            SELECT EXISTS(
                                SELECT 1
                                FROM followmosques AS followMosques
                                WHERE followMosques.mosque_id = Mosque.id
                                AND followMosques.user_id = '${userId || 0}'
                            )
                        )`),
                        "isFollowing",
                    ],
                ],
            },
            include: [
                {
                    model: MosqueProfile,
                    as: "mosqueProfile",
                    attributes: ["image"],
                },
            ],
        });

        // 7. Dispatch normalized data payload directly to the frontend context screen engine
        return res.status(201).json({
            status: 'success',
            message: 'Your mosque profile draft has been processed inside our tracking records.',
            mosque: fullyHydratedMosque
        });
    }
    catch (err) { 
        // Operational database tracking fallback guardrail execution path
        if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
            await transaction.rollback();
        }
        
        console.error("REGISTER MOSQUE CONTROLLER ERROR:", err.message);
        return next(
            new AppError(
                process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong during mosque setup execution.', 
                500
            )
        );
    }
};

  

export const getMosques = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const state = req.query.state;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (search) whereCondition.name = { [Op.like]: `%${search}%` };
    if (state) whereCondition.state = state;

    const { rows: mosques, count } = await Mosque.findAndCountAll({
      where: whereCondition,
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*)
              FROM followmosques AS followMosques
              WHERE followMosques.mosque_id = Mosque.id
            )`),
            "followersCount",
          ],
          // "isFollowing" subquery has been removed for a cleaner query
        ],
      },
      include: [
        {
          model: MosqueProfile,
          as: "mosqueProfile",
          attributes: ["image"],
        },
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return res.status(200).json({
      status: "success",
      total: count,
      totalPages: Math.ceil(count / limit),
      mosques,
    });
  } catch (err) {
    next(err);
  }
};



export const getMosque = async (req, res, next) => {
  try {
    const { id } = req.params; // Expecting ID from the URL: /mosque/:id

    const mosque = await Mosque.findByPk(id, {
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*)
              FROM followmosques AS followMosques
              WHERE followMosques.mosque_id = Mosque.id
            )`),
            "followersCount",
          ],
        ],
      },
      include: [
        {
          model: MosqueProfile,
          as: "mosqueProfile"
        },
      ],
    });

    // Handle case where no mosque is found with the provided ID
    if (!mosque) {
      return res.status(404).json({
        status: "error",
        message: "Mosque not found",
      });
    }

    return res.status(200).json({
      status: "success",
        mosque
    });
  } catch (err) {
    next(new AppError( process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong during fetch mosque', 
                500));
  }
};


export const getUserFollowedMosques = async (req, res, next) => {
  try {
    // 🛡️ Guard Clause: Fail immediately if auth middleware missed populating req.user
    if (!req.user || !req.user.id) {
      return next(new AppError("You must be authenticated to fetch followed mosques.", 401));
    }

    // 1. Direct variable assignments for easy debugging logs
    const userId = req.user.id; 
    console.log(">>>>>>>> DEBUGGING: Fetching mosques followed by User ID:", userId);

    // 2. Find all mosques that this specific user follows
    const followedMosques = await Mosque.findAll({
      include: [
        {
          model: FollowMosque,
          as: "followers", // Must exactly match your Sequelize relationship alias
          where: { userId: userId }, // 🔥 FIXED: No longer undefined!
          attributes: [], // Keeps the output clean of follow-join table clutter
        },
        {
          model: MosqueProfile,
          as: "mosqueProfile",
          attributes: ["image"],
        },
      ],
      attributes: {
        include: [
          // 📊 Count total followers for each mosque globally
          [
            literal(`(
              SELECT COUNT(*)
              FROM followmosques AS followMosques
              WHERE followMosques.mosque_id = Mosque.id
            )`),
            "followersCount",
          ],
          // ✅ Is this specific requesting user following this mosque? (Will be true here)
          [
            literal(`(
              SELECT EXISTS(
                SELECT 1
                FROM followmosques AS followMosques
                WHERE followMosques.mosque_id = Mosque.id
                AND followMosques.user_id = '${userId}'
              )
            )`),
            "isFollowing",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    console.log(`>>>>>>>> DEBUGGING: Successfully found ${followedMosques.length} mosques.`);

    // 3. Return the response payload
    return res.status(200).json({
      status: "success",
      message: "Followed mosques retrieved successfully",
      results: followedMosques.length,
      mosques: followedMosques
    });

  } catch (err) { 
    console.error(">>>>>>>> CRITICAL ERROR IN getUserFollowedMosques:", err);
    
    // Fix: Moved your custom AppError to fire BEFORE your catch block tries to hit next(err) twice
    return next(
      new AppError(
        process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong while fetching followed mosques', 
        500
      )
    );
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
        console.error(err.message);
        next(new AppError(process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'Something went wrong during the pending mosque lookup process.'))
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
    console.error("ERROR IN getFollowedMosqueIds:", err);
    return next(new AppError("Something went wrong while fetching your follow list.", 500));
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
        if (process.env.NODE_ENV === 'development') {
            console.error(err);
        }
        
        next(new AppError(
            process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'Something went wrong during the mosque verification process.',
            500
        ));
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
    next(err);
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
        next(new AppError('Update failed', 500));
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
    console.error("Delete Mosque Error:", err.message);
    next(new AppError("Failed to delete mosque: " + err.message, 500));
  }
};