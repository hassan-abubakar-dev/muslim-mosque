import express from 'express';

import { getAllSurahs, getSurahById } from '../controllers/quran.js';

const router = express.Router();

router.get("/surahs", getAllSurahs);

// Single surah
router.get("/surahs/:id", getSurahById);

export default router;