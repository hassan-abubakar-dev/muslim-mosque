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

// GET single surah by ID
export const getSurahById = (req, res, next) => {

    try{
          const { id } = req.params;
  const surah = quran.find(s => s.id == id);
  if (!surah) return res.status(404).json({ message: "Surah not found" });
 
    res.status(200).json({ 
    status: 'success',
    data: surah 
  });
    }
        catch (error) { 
        return next(new AppError(isDev ? error.message : "Internal server error", 500));    
        }
};
