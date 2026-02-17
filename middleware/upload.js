import multer from "multer";
import path from "path";
import AppError from "../utils/AppError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  // IMAGE
  if (mime.startsWith("image/")) { 
    const allowed = [".png", ".jpg", ".jpeg", ".jfif"];
    if (!allowed.includes(ext)) {
      return cb(
        new AppError("Only image files (.png, .jpg, .jpeg, .jfif) are allowed", 400),
        false
      );
    }
    return cb(null, true);
  }

  // AUDIO
  if (mime.startsWith("audio/")) {
    const allowed = [".mp3", ".wav", ".m4a", ".ogg"];
    if (!allowed.includes(ext)) {
      return cb( 
        new AppError("Only audio files (.mp3, .wav, .m4a, .ogg) are allowed", 400),
        false
      );
    }
    return cb(null, true);
  }

  // VIDEO
  if (mime.startsWith("video/")) {
    const allowed = [".mp4", ".mov", ".avi", ".mkv"];
    if (!allowed.includes(ext)) {
      return cb(
        new AppError("Only video files (.mp4, .mov, .avi, .mkv) are allowed", 400),
        false
      );
    }
    return cb(null, true);
  }

  // EVERYTHING ELSE
  return cb(
    new AppError("Unsupported file type. Upload image, audio, or video only.", 400),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB (video safe)
  }
});

export default upload;
