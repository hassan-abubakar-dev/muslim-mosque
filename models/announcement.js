import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Announcement = db.define('Announcement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(255), // Longer titles for local context
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    mosqueId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    // Integrated image fields, both allow Null
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    publicId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Useful for your manual review process
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    underscored: true,
    timestamps: true,
});

export default Announcement;