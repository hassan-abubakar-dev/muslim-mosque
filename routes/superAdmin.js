import express from 'express';
import {getDashboardStats} from '../controllers/superAdmin.js';
import { protectRoutes, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard-stats', 
    protectRoutes, 
    authorize('superAdmin'), 
    getDashboardStats
);


export default router;