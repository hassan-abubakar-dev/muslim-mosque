import Mosque from "../models/mosque.js";
import FollowMosque from "../models/followMosque.js";
import AppError from "../utils/AppError.js";

export const toggleFollowMosque = async (req, res, next) => {
  try {
    const { mosqueId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("Unauthorized access", 401));
    } 

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
    console.error(err.message || err);
    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
        500
      )
    );
  }
};
