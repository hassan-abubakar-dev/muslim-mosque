import express from 'express';
import dotenv from 'dotenv';
import { saveLectureMetadata, deleteLecture, getLectures, getLectureCount } from '../controllers/lecture.js';
import { lectureParamsSchema, saveLectureSchema, getLecturesQuerySchema, deleteLectureSchema } from '../validation/lecture.js';
import validate from '../middleware/validation.js';

dotenv.config();

const router = express.Router();

router.get('/get-lecture-count/:categoryId', validate(lectureParamsSchema, 'params'), getLectureCount);

router.post('/save-metadata/:categoryId', 
    validate(lectureParamsSchema, 'params'), 
    validate(saveLectureSchema, 'body'), 
    saveLectureMetadata
);

router.delete('/delete-lecture/:id', 
   validate(deleteLectureSchema, 'params-query'),
    deleteLecture
);

router.get('/get-lectures/:categoryId', 
    validate(lectureParamsSchema, 'params'), 
    validate(getLecturesQuerySchema, 'query'), 
    getLectures
);

export default router;