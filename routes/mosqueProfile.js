import express from 'express';

import { protectRoutes } from '../controllers/auth.js';
import { updateMosqueProfile } from '../controllers/mosqueProfile.js';
import uploadToR2 from '../utils/upload2.js';

const router = express.Router();

router.put('/mosque-profile', protectRoutes, uploadToR2, updateMosqueProfile);
export default router;