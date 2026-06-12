import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { updateMosqueProfile } from '../controllers/mosqueProfile.js';
import { updateProfileBodySchema, updateProfileParamsSchema } from '../validation/mosqueProfile.js';
import validate from '../middleware/validation.js';


const router = express.Router();

router.put('/update-mosque-profile/:mosqueId', 
    protectRoutes, 
    validate(updateProfileParamsSchema, 'params'), 
    validate(updateProfileBodySchema, 'body'), 
    updateMosqueProfile
);
export default router;