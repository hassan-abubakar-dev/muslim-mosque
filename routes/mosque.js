import express from 'express';
import { protectRoutes, optionalAuth, authorize } from '../middleware/auth.js';
import { getMosque, getMosques, registerMosque, getUserFollowedMosques, getPendingMosques, verifiedMosque, getFollowedMosqueIds, deleteMosque, toggleSuspendAndUnsuspend, getSuspendedMosques } from '../controllers/mosque.js';
import validate from '../middleware/validation.js';
import { getMosquesQuerySchema, idParamSchema, mosqueIdParamSchema, registerMosqueValidationSchema } from '../validation/mosque.js';
import { toggleFollowMosque } from '../controllers/followMosque.js';

const router = express.Router();

// GET routes with query validation
router.get('/get-mosques', optionalAuth, validate(getMosquesQuerySchema, 'query'), getMosques);
router.get('/get-mosque/:id', protectRoutes, authorize('superAdmin'), validate(idParamSchema, 'params'), getMosque);

router.get('/get-followed-mosques', protectRoutes, getUserFollowedMosques);
router.get('/get-followed-mosque-ids', protectRoutes, getFollowedMosqueIds);
router.get('/get-pending-mosque', protectRoutes, authorize('superAdmin'), getPendingMosques);
router.get('/get-suspended-mosques', protectRoutes, authorize('superAdmin'), getSuspendedMosques);
router.post('/register-mosque', protectRoutes, validate(registerMosqueValidationSchema, 'body'), registerMosque);
router.post('/:mosqueId/follow', protectRoutes, validate(mosqueIdParamSchema, 'params'), toggleFollowMosque);
router.put('/verified-mosque/:mosqueId', protectRoutes, authorize('superAdmin'), validate(mosqueIdParamSchema, 'params'), verifiedMosque)
router.delete('/dete-mosque/:id', protectRoutes, validate(idParamSchema, 'params'), deleteMosque);
router.patch('/moderate/:mosqueId',  protectRoutes,  authorize('superAdmin'), validate(mosqueIdParamSchema, 'params'), toggleSuspendAndUnsuspend);

 
export default router; 