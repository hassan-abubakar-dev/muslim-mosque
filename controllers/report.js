import Report from '../models/Report.js';
import Mosque from '../models/Mosque.js';
import User from '../models/User.js';

// =========================================================
// 1. USER SUBMITS A REPORT (Saves Denormalized Data Safely)
// =========================================================
export const createReport = async (req, res, next) => {
    try {
        const { mosqueId, reasonCategory, customReason } = req.body;

        // 🔍 1. Find the target mosque to capture its current name snapshot
        const targetMosque = await Mosque.findByPk(mosqueId);
        if (!targetMosque) {
            return res.status(404).json({
                status: 'fail',
                message: 'The target mosque profile could not be found.'
            });
        }

        // 🔍 2. Find the logged-in user profile to grab their identity details 
        // (Assuming your auth middleware assigns user details to req.user)
        const reporter = await User.findByPk(req.user.id);
        if (!reporter) {
            return res.status(404).json({
                status: 'fail',
                message: 'User authentication profile error.'
            });
        }

        // ⚡ 3. Create the flat report row record using our updated fields
        const report = await Report.create({
            targetMosqueName: targetMosque.name,
            // Assuming your user schema uses firstName/surName or common fallback properties
            reporterName: `${reporter.firstName || ''} ${reporter.surName || reporter.name || ''}`.trim() || 'Anonymous User',
            reporterEmail: reporter.email,
            reasonCategory,
            customReason,
            status: 'pending'
        });

        res.status(201).json({
            status: 'success',
            message: 'Report submitted for review successfully.',
            data: { report }
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 2. SUPER ADMIN GETS ALL ACTIVE PENDING REPORTS
// =========================================================
export const getAllReports = async (req, res, next) => {
    try {
        // Pull down our independent pagination limit dynamically from query parameters if needed
        const limit = parseInt(req.query.limit, 10) || 5;

        // 🚀 High-speed fetch query with zero joins needed for primary layout rendering
        const reports = await Report.findAll({
            where: { status: 'pending' },
            limit: limit,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: 'success',
            results: reports.length,
            data: { reports }
        });
    } catch (err) {
        next(err);
    }
};

// =========================================================
// 3. SUPER ADMIN RESOLVES AND CLOSES A TICKETS ENTRY
// =========================================================
export const resolveReport = async (req, res, next) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) {
            return res.status(404).json({ 
                status: 'fail',
                message: 'Report registration index not found.' 
            });
        }

        report.status = 'resolved';
        await report.save();

        res.status(200).json({ 
            status: 'success', 
            message: 'Report ticket marked as resolved and successfully filed away.' 
        });
    } catch (err) { 
        next(err);
    }
};