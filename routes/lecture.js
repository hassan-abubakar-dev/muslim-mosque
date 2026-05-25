import express from 'express';
import dotenv from 'dotenv';
import { saveLectureMetadata, deleteLecture, getLectures } from '../controllers/lecture.js';

dotenv.config();

const router = express.Router();

router.post('/save-metadata/:categoryId', saveLectureMetadata);
router.delete('/delete-lecture/:lectureId', deleteLecture);
router.get('/get-lectures/:categoryId', getLectures);

export default router;