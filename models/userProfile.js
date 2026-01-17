import { DataTypes, UUIDV4 } from "sequelize";
import dbConnection from "../config/db.js";

const userProfile =  dbConnection.define('userProfile', {

    id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true
    }, 
    image: {
        type: DataTypes.STRING(225),
        allowNull: false
    },
    publicId: {
        type: DataTypes.STRING(225),
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
},
{
    tableName: 'userProfiles',
    timestamps: true,
    underscored: true
}
);

export default userProfile;