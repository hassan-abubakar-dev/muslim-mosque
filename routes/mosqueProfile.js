import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { updateMosqueProfile } from '../controllers/mosqueProfile.js';


const router = express.Router();

router.put('/update-mosque-profile/:mosqueId', protectRoutes, updateMosqueProfile);
export default router;