// import {Feedback} from "../models/relationship.js";
import Feedback from "../models/feedback.js";
import AppError from "../utils/appError.js";   

export const submitFeedback = async (req, res, next) => {
  try {
    const { type, message, email, contactConsent } = req.body;

    // 1. Identify the user if they are logged in
    // If your auth middleware sets req.user, we grab the ID
    const userId = req.user ? req.user.id : null;

    // 2. Logic: If logged in, we use the account email. 
    // If guest, we use the email they typed in the optional box.
    const finalEmail = req.user ? req.user.email : email;

    // 3. Create the database record
    const newFeedback = await Feedback.create({
      type,
      message,
      email: finalEmail,
      contactConsent,
      userId,
      status: "pending", // Default starting status
    });

    // 4. Response
    res.status(201).json({
      status: "success",
      message: "Feedback submitted successfully!",
      data: {
        feedback: newFeedback,
      },
    });
  } catch (err) {
    // Pass any errors (like validation errors) to your global error handler
    next(err);
  }
};



export const getAllFeedbacks = async (req, res, next) => {
  try {
    // 1. Get page and limit from query strings (e.g., /api/feedback?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 2. Fetch data and total count at once
    const { count, rows } = await Feedback.findAndCountAll({
      limit,
      offset,
      order: [["created_at", "DESC"]], // Show newest first
      // Optional: You could include user details if userId is present
      // include: [{ model: User, attributes: ['name', 'email'] }] 
    });

    // 3. Send response with pagination metadata
    res.status(200).json({
      status: "success",
      results: rows.length,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: { feedbacks: rows },
    });
  } catch (err) {
    next(err);
  }
};


export const resolveFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body; // Optional: Store why/how you fixed it

    // 1. Find the feedback
    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return next(new AppError("No feedback found with that ID", 404));
    }

    // 2. Check if already resolved to avoid redundant work
    if (feedback.status === "resolved") {
      return res.status(400).json({
        status: "fail",
        message: "This feedback is already resolved.",
      });
    }

    // 3. Mark as resolved
    feedback.status = "resolved";
    // If you add an adminNote column to your schema later, you'd save it here
    await feedback.save();

    // 4. (Optional) Email Logic
    // if (feedback.email && feedback.contactConsent) {
    //    await sendEmail(feedback.email, "Your Masjiba feedback has been resolved!");
    // }

    res.status(200).json({
      status: "success",
      message: "Feedback marked as resolved successfully.",
      data: { feedback },
    });
  } catch (err) {
    next(err);
  }
};