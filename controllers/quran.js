import quran from "../data/quran.js";
import dotenv from 'dotenv';

dotenv.config();
import AppError from "../utils/AppError.js";

const isDev = process.env.NODE_ENV === 'development';

// GET all surahs
export const getAllSurahs = (req, res, next) => {
 
    try {
         const surahsList = quran.map(s => ({
    id: s.id,
    name: s.name,
    transliteration: s.transliteration,
    total_verses: s.total_verses
  }));
  
  res.status(200).json({
    status: 'success',
    data: surahsList
  });
    } catch (error) {
        return next(new AppError(isDev ? error.message : "Internal server error", 500));
    }
};

export const getSurahById = (req, res, next) => {
  try {
    const { id } = req.params;

    const surah = quran.find(s => s.id == id);

    if (!surah) {
      return next(new AppError("Surah not found", 404));
    }

    // Return ONLY metadata (no verses)
    const surahInfo = {
      id: surah.id,
      name: surah.name,
      transliteration: surah.transliteration,
      type: surah.type,
      total_verses: surah.total_verses
    };

    res.status(200).json({
      status: "success",
      data: surahInfo
    });

  } catch (error) {
    return next(new AppError(isDev ? error.message : "Internal server error", 500));
  }
};

export const getSurahVerses = (req, res, next) => {
  try {
    const { id } = req.params;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    console.log(`Fetching verses for Surah ID: ${id}, Page: ${page}, Limit: ${limit}`);

    const surah = quran.find(s => s.id == id);

    if (!surah) {
      return next(new AppError("Surah not found", 404));
    }

    const totalVerses = surah.verses.length;

    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedVerses = surah.verses.slice(start, end);

    res.status(200).json({
      status: "success",
      data: {
        surahId: surah.id,
        page,
        limit,
        totalVerses,
        totalPages: Math.ceil(totalVerses / limit),
        verses: paginatedVerses
      }
    });

  } catch (error) {
    return next(new AppError(isDev ? error.message : "Internal server error", 500));
  }
};

