// models/Lecture.js
import { DataTypes } from "sequelize";
import dbConnection from "../config/db.js";

const Lecture = dbConnection.define(
  "Lecture",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("audio", "video"),
      allowNull: false,
    },

    url: {
      type: DataTypes.STRING(220),
      allowNull: true,
    },
    // Optional public ID for cloud storage (e.g., Cloudinary) to facilitate updates/deletions in the future
    publicId: {
        type: DataTypes.STRING(225),
        allowNull: true
    },
    // Optional duration field for audio lectures (in seconds) to help with UI display and progress tracking
    duration: {
      type: DataTypes.INTEGER, // duration in seconds
      allowNull: true,
    },
    // Optional thumbnail URL for video lectures (can be generated from YouTube video ID or provided by admin)
    thumbnail: {
      type: DataTypes.STRING(220),
      allowNull: true,
    },
    // for YouTube videos, we can store the video ID to easily generate embed links and thumbnails
videoId: {
      type: DataTypes.STRING(220),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "lectures",
    timestamps: true,
  }
);

export default Lecture;
