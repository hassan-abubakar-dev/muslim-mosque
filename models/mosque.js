import { DataTypes, UUIDV4 } from "sequelize";
import dbConnection from "../config/db.js";

const Mosque = dbConnection.define(
    'Mosque',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: UUIDV4,
            primaryKey: true
        },
        name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      localGovernment: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
      },
      adminId: {
        type: DataTypes.UUID,
        allowNull: false,
      }
    },
    {
      tableName: 'mosques',
      timestamps: true,
      underscored: true
    }

    
);

export default Mosque;