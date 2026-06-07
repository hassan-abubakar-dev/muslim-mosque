import {Feedback, User} from "../models/relationship.js";

import AppError from "../utils/appError.js";   

export const submitFeedback = async (req, res, next) => {
  try {
    const { type, message, email, contactConsent } = req.body;

    // 1. Safely handle optional user
    const userId = req.user ? req.user.id : null; 

    // 2. Logic: Prioritize the email from req.body (in case the user updated it),
    // then fallback to the profile email if they are logged in.
    const finalEmail = email || (req.user ? req.user.email : null);

    // 3. Validation
    if (!message || message.trim().length === 0) {
       return res.status(400).json({ status: "fail", message: "Message cannot be empty." });
    }

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
    // Make sure AppError is defined in your scope
    next(err); 
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
    next(new AppError(err.message, 500));
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
        console.error("RESOLVE FEEDBACK ERROR:", err.message);
        next(err);
    }
};




