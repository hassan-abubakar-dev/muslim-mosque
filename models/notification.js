// models/Notification.js
import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Notification = db.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    mosqueId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('announcement', 'lecture'),
        allowNull: false,
    },
    // Nullable Foreign Keys for the Target
    announcementId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    lectureId: {
        type: DataTypes.UUID,
        allowNull: true,
    }
}, {
    underscored: true,
    timestamps: true,
});

export default Notification;