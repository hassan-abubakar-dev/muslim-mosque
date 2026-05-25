import express from "express";
import { submitFeedback, getAllFeedbacks, resolveFeedback } from "../controllers/feedback.js";
import { protectRoutes } from '../middleware/auth.js';

const router = express.Router();

// optionalAuth checks for a token; if found, it sets req.user. 
// If not found, it just calls next() so the user remains a guest.
router.post("/submit", protectRoutes, submitFeedback);
router.get("/get", protectRoutes, getAllFeedbacks);
router.patch("/resolve/:id", protectRoutes, resolveFeedback);

export default router;