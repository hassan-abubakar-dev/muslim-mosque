import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Bookmark = db.define('Bookmark', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,  
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    lectureId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    // Progress tracking in seconds (e.g., 120 = 2 minutes in)
    lastPosition: {
        type: DataTypes.INTEGER,  
        defaultValue: 0,
        allowNull: false
    }
}, {
    timestamps: true, // Used to sort by "Recently Bookmarked"
    underscored: true,
    // Prevents a user from bookmarking the same lecture twice
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'lecture_id']
        }
    ]
});

export default Bookmark;