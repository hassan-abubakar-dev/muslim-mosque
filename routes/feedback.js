import express from "express";
import { submitFeedback, getAllFeedbacks, resolveFeedback } from "../controllers/feedback.js";
import { authorize, optionalAuth, protectRoutes } from '../middleware/auth.js';
import { feedbackIdParamSchema, getFeedbacksSchema, submitFeedbackSchema } from "../validation/feedback.js";
import validate from '../middleware/validation.js';

const router = express.Router();

// optionalAuth checks for a token; if found, it sets req.user. 
// If not found, it just calls next() so the user remains a guest.
router.post("/submit", optionalAuth, validate(submitFeedbackSchema, 'body'), submitFeedback);
router.get("/get", protectRoutes, validate(getFeedbacksSchema, 'query'), getAllFeedbacks);
router.patch("/resolve/:id", protectRoutes, authorize('superAdmin'), validate(feedbackIdParamSchema, 'params'), resolveFeedback);

export default router;