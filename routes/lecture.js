import express from "express";
import {
  generateLectureUploadUrl,
  saveLectureMetadata,
  getLecturePlaybackUrl,
  getAllLectures
} from "../controllers/lecture.js";
import { protectRoutes } from "../controllers/auth.js";

const router = express.Router();

// Generate signed PUT URL
router.post("/generate-upload-url/:categoryId", protectRoutes, generateLectureUploadUrl);

// Save metadata after upload
router.post("/save-metadata/:categoryId", protectRoutes, saveLectureMetadata);

// Generate signed GET URL for playback
router.get("/play/:id", protectRoutes, getLecturePlaybackUrl);
router.get('/all/:categoryId', protectRoutes, getAllLectures);

export default router;