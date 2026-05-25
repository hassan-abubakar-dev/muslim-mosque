import express from 'express';
import {toggleBookmark, getBookmarks} from '../controllers/bookmark.js';
import { protectRoutes } from '../middleware/auth.js';
const router = express.Router();

router.post('/toggle/:lectureId', protectRoutes, toggleBookmark);
router.get('/get', protectRoutes, getBookmarks);

export default router;