import express from 'express';
import {toggleVideoLibrary, getVideoLibrary, removeFromLibrary} from '../controllers/videoLibrary.js';
import { protectRoutes } from '../middleware/auth.js';
const router = express.Router();

router.post('/toggle-save/:lectureId', protectRoutes, toggleVideoLibrary);
router.get('/get-library', protectRoutes, getVideoLibrary);
router.delete('/remove/:lectureId', protectRoutes, removeFromLibrary);

export default router;