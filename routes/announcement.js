import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { createAnnouncement, getAnnouncements, deleteAnnouncement} from '../controllers/announcement.js';
import { 
    announcementSchema, 
    paginationSchema, 
    mosqueIdParamSchema, 
    announcementIdParamSchema 
} from '../validation/announcement.js';
import validate from '../middleware/validation.js';


const router = express.Router();

router.get('/get-announcements/:mosqueId', 
   validate(mosqueIdParamSchema, 'params'), 
   validate(paginationSchema, 'query'), 
    getAnnouncements);
router.post('/create-announcement/:mosqueId', 
    validate(mosqueIdParamSchema, 'params'),
  validate(announcementSchema, 'body'), protectRoutes, createAnnouncement);
router.delete('/delete-announcement/:id',validate(announcementIdParamSchema, 'params'), protectRoutes, deleteAnnouncement);

export default router;