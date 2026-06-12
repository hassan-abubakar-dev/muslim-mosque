import Mosque from "../models/mosque.js";
import FollowMosque from "../models/followMosque.js";
import AppError from "../utils/AppError.js";
import dotenv from 'dotenv';

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

export const toggleFollowMosque = async (req, res, next) => {
  try {
    const { mosqueId } = req.params;
    const userId = req.user?.id;


    const mosque = await Mosque.findByPk(mosqueId);
    if (!mosque) {
      return next(new AppError("Mosque not found", 404));
    }

    const existingFollow = await FollowMosque.findOne({
      where: { userId, mosqueId },
    });

    if (existingFollow) {
      await existingFollow.destroy();
      return res.status(200).json({
        status: "success",
        follow: false,
        message: "Mosque unfollowed successfully",
        mosqueId
      });
    }

    await FollowMosque.create({ userId, mosqueId });
    return res.status(201).json({
      status: "success",
      message: "Mosque followed successfully",
      follow: true,
      mosqueId
    });
  } catch (err) {
    const errorContext = {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      ...(req.body?.email && { email: req.body.email }),
    };
    console.error('TOGGLE_FOLLOW_MOSQUE_ERROR: Failed to toggle mosque follow', { context: errorContext, error: err });
    next(new AppError(isDev ? err.message : "Something went wrong", 500));
  }
};
