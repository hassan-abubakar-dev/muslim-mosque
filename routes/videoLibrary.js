import express from 'express';
import {toggleVideoLibrary, getVideoLibrary, removeFromLibrary} from '../controllers/videoLibrary.js';
import { protectRoutes } from '../middleware/auth.js';
import { videoLibraryQuerySchema, lectureIdParamsSchema } from '../validation/videoLibrary.js';
import validate from '../middleware/validation.js';
const router = express.Router();

router.get('/get-library', protectRoutes, validate(videoLibraryQuerySchema, 'query'), getVideoLibrary);
router.post('/toggle-save/:lectureId', protectRoutes, validate(lectureIdParamsSchema, 'params'), toggleVideoLibrary);
router.delete('/remove/:lectureId', protectRoutes, validate(lectureIdParamsSchema, 'params'), removeFromLibrary);

export default router;