
// import { User, Mosque, Report, Feedback } from '../models';
import  User  from '../models/User.js';
import Mosque  from '../models/Mosque.js';
import  Report from '../models/Report.js';
import  Feedback  from '../models/Feedback.js';
import AppError from '../utils/AppError.js';
import dotenv from 'dotenv';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

export const getDashboardStats = async (req, res, next) => {
    try {
        // Run all count queries in parallel. 
        // This hits the DB once for each specific count, 
        // which is extremely fast and memory-efficient.
        const [
            totalActiveUsers,
            totalInActiveUsers,
            totalAgents,
            totalVerifiedMosques,
            totalPendingMosques,
            pendingReportsCount,
            pendingFeedbackCount
        ] = await Promise.all([
            User.count({ where: { isVerify: true } }),
            User.count({ where: { isVerify: false } }),
            User.count({ where: { isVerify: true, role: 'agent' } }),
            Mosque.count({ where: { status: 'verified' } }),
            Mosque.count({ where: { status: 'pending' } }),
            Report.count({ where: { status: 'pending' } }),
            Feedback.count({ where: { status: 'pending' } }) 
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                usersCounts: {
                    totalActiveUsers,
                    totalInActiveUsers,
                    totalAgents
                },
                mosquesCounts: {
                    totalVerifiedMosques,
                    totalPendingMosques
                },
                pendingReportsCount,
                pendingFeedbackCount
            }
        });
    } catch (err) {
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
        console.error('GET_DASHBOARD_STATS_ERROR: Failed to fetch dashboard statistics', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'Failed to fetch dashboard statistics', 500));
    }
};