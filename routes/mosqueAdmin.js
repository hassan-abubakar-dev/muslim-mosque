import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { addAdminAssistant, fetchTeamRoster, removeAdminAssistant } from '../controllers/mosqueAdmin.js';

const router = express.Router();

router.get('/team-roster/:mosqueId', protectRoutes, fetchTeamRoster);
router.post('/add-admin-assistant', protectRoutes, addAdminAssistant);
router.delete('/remove-admin-assistant', protectRoutes, removeAdminAssistant);
export default router;