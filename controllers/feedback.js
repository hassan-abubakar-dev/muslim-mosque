import {Feedback, User} from "../models/relationship.js";

import AppError from "../utils/appError.js";  
import dotenv from 'dotenv';
dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

export const submitFeedback = async (req, res, next) => {
  try {
    const { type, message, email, contactConsent } = req.body;

    // 1. Safely handle optional user
    const userId = req.user ? req.user.id : null; 

    // 2. Logic: Prioritize the email from req.body (in case the user updated it),
    // then fallback to the profile email if they are logged in.
    const finalEmail = email || (req.user ? req.user.email : null);

  
    // 4. Create record
    const newFeedback = await Feedback.create({
      type,
      message,
      email: finalEmail,
      contactConsent,
      userId,
      status: "pending",
    });

    res.status(201).json({
      status: "success",
      message: "Feedback submitted successfully!",
      data: { feedback: newFeedback }
    });
  } catch (err) {
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('SUBMIT_FEEDBACK_ERROR: Failed to submit feedback', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Something went wrong', 500));
  }
};



export const getAllFeedbacks = async (req, res, next) => {
  try {
    // 1. Get page and limit from query strings
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
  
    const offset = (page - 1) * limit;

    // 2. Fetch data and total count
    // Using include to fetch user details without heavy profile data
    const { count, rows } = await Feedback.findAndCountAll({
      where: { status: 'pending' },
      limit,
      offset,
      order: [["created_at", "DESC"]], 
      include: [{
        model: User,
        as: 'user', // Ensure this matches your relationship alias
        attributes: ['id', 'firstName', 'surName', 'email', 'role']
      }]
    });

    // 3. Send response with pagination metadata
    res.status(200).json({
      status: "success",
      results: rows.length,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: { 
        feedbacks: rows 
      },
    });
  } catch (err) {
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('GET_ALL_FEEDBACKS_ERROR: Failed to fetch feedbacks', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : 'Something went wrong', 500));
  }
};


export const resolveFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Find the feedback
        const feedback = await Feedback.findByPk(id);
        
        if (!feedback) {
            return res.status(404).json({ 
                status: 'fail',
                message: 'Feedback ticket not found.' 
            });
        }

        // 2. Update status
        feedback.status = 'resolved';
        await feedback.save();

        // 3. Conditional Email Notification
        // Only send if the user explicitly opted-in to contact and provided an email
        if (feedback.contactConsent && feedback.email) {
            const html = `
                <h2>Feedback Resolved</h2>
                <p>Dear User,</p>
                <p>Thank you for sharing your feedback with us. We wanted to let you know that your submission regarding <strong>${feedback.type.replace('_', ' ')}</strong> has been reviewed and addressed.</p>
                <p>Your input is invaluable in helping us improve our platform for the community.</p>
                <br>
                <p>Best regards,<br>Muslim Mosque Admin Team</p>
            `;

            try {
                await sendEmail({
                    to: feedback.email,
                    subject: `Update: Your feedback has been resolved`,
                    html,
                });
            } catch (emailErr) {
                // Log email error but don't fail the entire request 
                // since the resolution in the DB was successful
                console.error("Feedback email notification failed:", emailErr.message);
            }
        }

        // 4. Success response
        return res.status(200).json({ 
            status: 'success', 
            message: 'Feedback marked as resolved.' 
        });

    } catch (err) { 
      const errorContext = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        ...(req.body?.email && { email: req.body.email }),
      };
      console.error('RESOLVE_FEEDBACK_ERROR: Failed to resolve feedback ticket', { context: errorContext, error: err });
      next(new AppError(isDev ? err.message : 'Something went wrong', 500));
    }
};




