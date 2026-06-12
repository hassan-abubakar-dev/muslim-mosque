import adzkar from "../data/adzkar.js";
import dotenv from 'dotenv';
import AppError from "../utils/AppError.js";
dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

export const getAllAdzkar = (req, res, next) => {   
    try {
        const adzkarList = adzkar.map(a => ({
            id: a.id,
            type: a.type,
            count_description: a.count_description,
            fadl: a.fadl,
            audio: a.audio,
            languages: a.languages
        }));    
        res.status(200).json({
            status: "success",
            data: adzkarList
        });
    } catch (err) {
        const errorContext = {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            ...(req.body?.email && { email: req.body.email }),
        };
        console.error("GET_ALL_ADZKAR_ERROR: Failed to fetch adzkar list", { context: errorContext, error: err });
        next(new AppError(isDev ? err.message : 'Internal server error', 500));
    }
};  