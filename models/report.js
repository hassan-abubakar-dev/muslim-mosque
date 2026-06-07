import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Report = db.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // ID Linkage for Admin Dashboard
    mosqueId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    reporterId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    // Snapshots remain for historical audit
    targetMosqueName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    reporterName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    reporterEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true }
    },
    reasonCategory: {
        type: DataTypes.ENUM('fake_account', 'unislamic_media', 'wrong_location', 'inappropriate_info', 'other'),
        allowNull: false
    },
    customReason: {
        type: DataTypes.TEXT,
        allowNull: true, 
    },
    status: {
        type: DataTypes.ENUM('pending', 'resolved'),
        defaultValue: 'pending',
    }
}, {
    underscored: true,
    timestamps: true 
});

export default Report;