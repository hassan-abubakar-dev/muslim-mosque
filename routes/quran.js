import express from 'express';

import { getAllSurahs, getSurahById, getSurahVerses } from '../controllers/quran.js';
import { surahParamsSchema, versesQuerySchema } from '../validation/quran.js';
import validate from '../middleware/validation.js';

const router = express.Router();

router.get("/surahs", getAllSurahs);

router.get('/surah/:id', 
    validate(surahParamsSchema, 'params'), 
    getSurahById
);

router.get('/surah/:id/verses', 
    validate(surahParamsSchema, 'params'), 
    validate(versesQuerySchema, 'query'), 
    getSurahVerses
);

export default router;