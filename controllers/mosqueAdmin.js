import AppError from '../utils/appError.js';
import dotenv from 'dotenv';
import { User, UserProfile, MosqueAdmin } from '../models/relationship.js';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';


export const addAdminAssistant = async (req, res, next) => {
    try {
        const { mosqueId, targetUserId } = req.body;
        console.log('Received request to add assistant:', { mosqueId, targetUserId, requesterId: req.user.id });
        const currentUserId = req.user.id; // From your verification token middleware
        

        // 1. Authorization: Verify the requester is actually the primary OWNER of this mosque
        const requesterAccess = await MosqueAdmin.findOne({
            where: { 
                mosqueId, 
                userId: currentUserId 
            }
        });

        if (!requesterAccess || requesterAccess.role !== 'owner') {
            return next(new AppError('Access Denied. Only the primary mosque owner can add assistants to the team.', 403));
        }

        // 2. Prevent adding themselves again redundantly
        if (targetUserId === currentUserId) {
            return next(new AppError('Operation invalid: You are already the owner of this hub.', 400));
        }

        // 3. Check if the target user is already an admin or assistant for this mosque
        const existingMember = await MosqueAdmin.findOne({
            where: {
                mosqueId,
                userId: targetUserId
            }
        });

        if (existingMember) {
            return next(new AppError('This user is already a member of your mosque management roster.', 400));
        }

        // 4. Create the new permission layer row, explicitly stating 'assistant'
        const newAssistant = await MosqueAdmin.create({
            mosqueId,
            userId: targetUserId,
            role: 'assistant'
        });

        res.status(201).json({
            status: 'success',
            message: 'Assistant added and granted privileges successfully.',
            data: {
                assignment: newAssistant
            }
        });

    } catch (err) {
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
        console.error('ADD_ADMIN_ASSISTANT_ERROR: Failed to add assistant', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'An error occurred while writing management privileges to the database.'));
    }
};



export const fetchTeamRoster = async (req, res, next) => {
    try {
        const { mosqueId } = req.params; 
    
        // Fetch all matching rows within your underscored junction table model
        const roster = await MosqueAdmin.findAll({
            where: { mosqueId },
            // Sort your list so the primary 'owner' is always pinned at the top slot of the vertical array list
            order: [
                ['role', 'ASC'], // 'owner' comes alphabetically before 'assistant'
                ['createdAt', 'ASC']
            ],
            attributes: ['id', 'role', 'createdAt'], // Junction row information
            include: [
                {
                    model: User,
                    as: 'user', // Ensure this matches your defined association alias
                    attributes: ['id', 'firstName', 'surName', 'email'],
                    include: [
                        {
                            model: UserProfile,
                            as: 'userProfile', // Ensure this matches your defined association alias
                            attributes: ['image'] // Plucks the image field for the avatar
                        }
                    ]
                }
            ]
        });

        // Returning the raw array directly makes it easier to log and debug the join schema layout
        res.status(200).json({
            status: 'success',
            message: 'Mosque team administrative roster fetched successfully.',
            data: {
                team: roster
            }
        });

    } catch (err) {
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
        console.error('FETCH_TEAM_ROSTER_ERROR: Failed to fetch mosque team roster', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'Something went wrong while retrieving your management team.'));
    }
};



export const removeAdminAssistant = async (req, res, next) => {
    try {
        // 🎯 FIX: Read from query params instead of body payload
        const { mosqueId, targetUserId } = req.query;
        const currentUserId = req.user.id; 


        // 1. Authorization Check: Verify the requester is the primary OWNER of this mosque
        const requesterAccess = await MosqueAdmin.findOne({
            where: { 
                mosqueId, 
                userId: currentUserId 
            }
        });

        if (!requesterAccess || requesterAccess.role !== 'owner') {
            return next(new AppError('Access Denied. Only the primary mosque owner can remove assistant administrators.', 403));
        }

        // 2. Safety Rule: Prevent the owner from deleting their own access row
        if (Number(targetUserId) === Number(currentUserId)) {
            return next(new AppError('Operation invalid: You cannot remove yourself as the primary owner.', 400));
        }

        // 3. Find the record using targetUserId mapped to your database schema column (userId)
        const memberToRemove = await MosqueAdmin.findOne({
            where: {
                mosqueId,
                userId: targetUserId 
            }
        });

        if (!memberToRemove) {
            return next(new AppError('No administrative access record found for this user at the specified mosque.', 404));
        }

        // Double check to ensure they aren't attempting to drop another owner row
        if (memberToRemove.role === 'owner') {
            return next(new AppError('Security lock violation: Primary owner records cannot be deleted through this panel.', 400));
        }

        // 4. Perform the deletion on the database row
        await memberToRemove.destroy();

        res.status(200).json({
            status: 'success',
            message: 'Assistant admin privileges revoked and member removed successfully.'
        });

    } catch (err) {
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.query?.email && { email: req.query.email }) };
        console.error('REMOVE_ADMIN_ASSISTANT_ERROR: Failed to remove assistant admin', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'An error occurred while revoking management privileges from the database.'));
    }
};