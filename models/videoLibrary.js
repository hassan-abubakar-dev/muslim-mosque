// 📄 models/VideoLibrary.js
import { DataTypes } from 'sequelize';
import db from '../config/db.js'; 

const VideoLibrary = db.define('VideoLibrary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID, // 👈 Swapped to UUID to match your Users table primary key
    allowNull: false,
  },
  lectureId: {
    type: DataTypes.UUID, // 👈 Swapped to UUID to match your Lectures table primary key
    allowNull: false,
  }
}, {
  tableName: 'video_libraries',
  timestamps: true, // Gives you 'createdAt' to sort by newest saved
});

export default VideoLibrary;