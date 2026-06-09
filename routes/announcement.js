import express from 'express';
import { protectRoutes } from '../middleware/auth.js';
import { createAnnouncement, getAnnouncements, deleteAnnouncement} from '../controllers/announcement.js';


const router = express.Router();

router.get('/get-announcements/:mosqueId',  getAnnouncements);
router.post('/create-announcement/:mosqueId', protectRoutes, createAnnouncement);
router.delete('/delete-announcement/:id', protectRoutes, deleteAnnouncement);

export default router;