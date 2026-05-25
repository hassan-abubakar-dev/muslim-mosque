import { DataTypes } from "sequelize";  
import dbConnection from "../config/db.js";

const MosqueAdmin = dbConnection.define('MosqueAdmin', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID, 
      allowNull: false
    },
    mosqueId: {
      type: DataTypes.UUID, 
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('owner', 'assistant'),
      allowNull: false,
      defaultValue: 'assistant' 
    }
  },
  {
    tableName: 'mosqueAdmins',
    timestamps: true,
    underscored: true // Automatically converts camelCase fields to snake_case in SQL queries
  }
);

export default MosqueAdmin;