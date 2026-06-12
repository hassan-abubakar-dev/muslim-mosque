import express from 'express';
import {createReport, getAllReports, resolveReport} from '../controllers/report.js';
import { authorize, protectRoutes } from '../middleware/auth.js';
import { 
    createReportParamsSchema, 
    createReportBodySchema, 
    getReportsQuerySchema, 
    reportIdParamsSchema 
} from '../validation/report.js';
import validate from '../middleware/validation.js';

const router = express.Router();

router.post('/create/:mosqueId', 
    protectRoutes, 
    validate(createReportParamsSchema, 'params'),
    validate(createReportBodySchema, 'body'),
    createReport
);

router.get('/get', 
    protectRoutes, 
    authorize('superAdmin'), 
    validate(getReportsQuerySchema, 'query'), 
    getAllReports
);

router.patch('/resolve/:id', 
    protectRoutes, 
    authorize('superAdmin'), 
    validate(reportIdParamsSchema, 'params'), 
    resolveReport
);

export default router;

