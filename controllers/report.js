import {Report, Mosque, User} from '../models/relationship.js'
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/sendEmail.js';
import dotenv from 'dotenv';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';


export const createReport = async (req, res, next) => {
    try {
        // 1. Get mosqueId from URL parameters, others from body
        const { mosqueId } = req.params; 
        const { reasonCategory, customReason, mosqueName } = req.body;

        // 2. Validate Category
        const validCategories = ['fake_account', 'unislamic_media', 'wrong_location', 'inappropriate_info', 'other'];
        if (!validCategories.includes(reasonCategory)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid report category.' });
        }

        // 3. Minimal Check: Verify the Mosque exists
        const mosqueExists = await Mosque.count({ where: { id: mosqueId } });
        if (!mosqueExists) {
            return res.status(404).json({ status: 'fail', message: 'Target mosque not found.' });
        }

        // 4. Create the record
        const report = await Report.create({
            mosqueId, // Using the ID from the route params
            reporterId: req.user.id,
            targetMosqueName: mosqueName, 
            reporterName: req.user.name || 'Anonymous User',
            reporterEmail: req.user.email,
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
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip, ...(req.body?.email && { email: req.body.email }) };
        console.error('CREATE_REPORT_ERROR: Failed to create report', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'Failed to create report', 500));
    }
};



export const getAllReports = async (req, res, next) => {
    try {
        const { page, limit } = req.query; // Joi-validated integers
        const offset = (page - 1) * limit;

        // 2. Fetch using only the Report table (High Performance)
        const { count, rows: reports } = await Report.findAndCountAll({
            where: { status: 'pending' },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        // 3. Return clean, structured response
        res.status(200).json({
            status: 'success',
            results: reports.length,
            totalCount: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: { reports }
        });
    } catch (err) {
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
        console.error('GET_ALL_REPORTS_ERROR: Failed to fetch reports', { context: errorContext, error: err });
        return next(new AppError(isDev ? err.message : 'Failed to retrieve reports.', 500));
    }
};

export const resolveReport = async (req, res, next) => {
    try {
        // 1. Find the report
        const {id} = req.params;
        const report = await Report.findByPk(id);
        
        if (!report) {
            return res.status(404).json({ 
                status: 'fail',
                message: 'Report ticket not found.' 
            });
        }

        // 2. Update status
        report.status = 'resolved';
        await report.save();

        // 3. Prepare professional email notification
        const html = `
            <h2>Report Resolved</h2>
            <p>Dear Reporter,</p>
            <p>We are writing to inform you that your report regarding <strong>${report.targetMosqueName}</strong> has been investigated and resolved.</p>
            <p>Thank you for your contribution to maintaining our community standards.</p>
            <br>
            <p>Best regards,<br>Muslim Mosque Admin Team</p>
        `;

        
        await sendEmail({
            to: report.reporterEmail,
            subject: `Update: Your report for ${report.targetMosqueName} has been resolved`,
            html,
        });

        // 5. Success response
        return res.status(200).json({ 
            status: 'success', 
            message: 'Report ticket marked as resolved and notification sent.' 
        });

    } catch (err) { 
        const errorContext = { url: req.originalUrl, method: req.method, ip: req.ip };
        console.error('RESOLVE_REPORT_ERROR: Failed to resolve report', { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'Failed to resolve report', 500));
    }
};


