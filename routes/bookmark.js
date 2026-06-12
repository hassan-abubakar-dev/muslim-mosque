import express from 'express';
import {toggleBookmark, getBookmarks} from '../controllers/bookmark.js';
import { protectRoutes } from '../middleware/auth.js';
import { getBookmarksSchema, lectureIdParamSchema, toggleBookmarkSchema } from '../validation/bookmark.js';
import validate from '../middleware/validation.js';
const router = express.Router();

router.post('/toggle/:lectureId', protectRoutes, validate(lectureIdParamSchema, 'params'), validate(toggleBookmarkSchema, 'body'), toggleBookmark);
router.get('/get', protectRoutes, validate(getBookmarksSchema, 'query'), getBookmarks);

export default router;