import express from 'express';

import { getAllSurahs, getSurahById, getSurahVerses } from '../controllers/quran.js';

const router = express.Router();

router.get("/surahs", getAllSurahs);

// Single surah

router.get('/surah/:id', getSurahById);
router.get('/surah/:id/verses', getSurahVerses);

export default router;