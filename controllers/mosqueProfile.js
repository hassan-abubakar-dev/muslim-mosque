import cloudinary from "../config/claudinary.js";
import MosqueProfile from "../models/mosqueProfile.js";
import AppError from "../utils/AppError.js";

export const updateMosqueProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { imageUrl, publicId } = req.body;
    const {mosqueId} = req.params;

    if (!imageUrl || !publicId) {
      return next(
        new AppError("imageUrl and publicId are required", 400)
      );
    }

    const mosqueProfile = await MosqueProfile.findOne({
      where: { mosqueId },
    });

    if (!mosqueProfile) {
      return next(
        new AppError("No profile found for this mosque", 404)
      );
    }

    // delete old image from cloudinary
    if (mosqueProfile.publicId) {
      await cloudinary.uploader.destroy(mosqueProfile.publicId);
    }

    // update DB
    mosqueProfile.image = imageUrl;
    mosqueProfile.publicId = publicId;

    await mosqueProfile.save();

    return res.status(200).json({
      status: "success",
      message: "Mosque profile updated successfully",
      mosqueProfile: mosqueProfile.image,
    });
  } catch (err) {
    next(
      new AppError(
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong while updating mosque profile",
        500
      )
    );
  }
};