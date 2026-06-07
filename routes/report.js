import express from 'express';
import {createReport, getAllReports, resolveReport} from '../controllers/report.js';
import { authorize, protectRoutes } from '../middleware/auth.js';

const router = express.Router();

router.post('/create/:mosqueId', protectRoutes, createReport);
router.get('/get', protectRoutes, authorize('superAdmin'), getAllReports); 
router.patch('/resolve/:id', protectRoutes, authorize('superAdmin'), resolveReport);


export default router;

