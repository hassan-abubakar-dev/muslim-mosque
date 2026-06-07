import express from 'express';
import { protectRoutes, optionalAuth, authorize } from '../middleware/auth.js';
import { getMosque, getMosques, registerMosque, getUserFollowedMosques, getPendingMosques, verifiedMosque, getFollowedMosqueIds } from '../controllers/mosque.js';
import validate from '../middleware/validation.js';
import { registerMosqueValidationSchema } from '../validation/mosque.js';
import { toggleFollowMosque } from '../controllers/followMosque.js';

const router = express.Router();

router.get('/get-mosques', optionalAuth, getMosques); 
router.get('/get-mosque/:id', optionalAuth, authorize('superAdmin'), getMosque);  
router.get('/get-followed-mosques', protectRoutes, getUserFollowedMosques);
router.get('/get-followed-mosque-ids', protectRoutes, getFollowedMosqueIds);
router.get('/get-pending-mosque', protectRoutes, authorize('superAdmin'), getPendingMosques)
router.post('/register-mosque', protectRoutes, validate(registerMosqueValidationSchema), registerMosque);
router.post('/:mosqueId/follow', protectRoutes, toggleFollowMosque);
router.put('/verified-mosque/:mosqueId', protectRoutes, authorize('superAdmin'), verifiedMosque)

 
export default router; 