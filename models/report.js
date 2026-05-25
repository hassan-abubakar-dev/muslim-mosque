import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Report = db.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    targetMosqueName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    reporterName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    reporterEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    // Upgraded: Predefined categories for fast filtering/sorting
    reasonCategory: {
        type: DataTypes.ENUM('fake_account', 'unislamic_media', 'wrong_location', 'inappropriate_info', 'other'),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    // Upgraded: Stores the user's custom text descriptions
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