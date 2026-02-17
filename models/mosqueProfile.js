import { DataTypes, UUIDV4 } from "sequelize";
import dbConnection from "../config/db.js";

const MosqueProfile =  dbConnection.define('MosqueProfile', {

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
    mosqueId: {
        type: DataTypes.UUID,
        allowNull: false
    }
},
{
    tableName: 'mosqueProfiles',
    timestamps: true,
    underscored: true 
}
);

export default MosqueProfile;