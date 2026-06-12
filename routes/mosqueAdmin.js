import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { 
    teamRosterParamsSchema, 
    adminAssistantBodySchema, 
    removeAssistantQuerySchema 
} from '../validation/mosqueAdmin.js'
import { addAdminAssistant, fetchTeamRoster, removeAdminAssistant } from '../controllers/mosqueAdmin.js';
import validate from '../middleware/validation.js';

const router = express.Router();

router.get('/team-roster/:mosqueId', 
    protectRoutes, 
    validate(teamRosterParamsSchema, 'params'), 
    fetchTeamRoster
);

router.post('/add-admin-assistant', 
    protectRoutes, 
    validate(adminAssistantBodySchema, 'body'), 
    addAdminAssistant
);

router.delete('/remove-admin-assistant', 
    protectRoutes, 
    validate(removeAssistantQuerySchema, 'query'), 
    removeAdminAssistant
);


export default router;