import { DataTypes, UUIDV4 } from "sequelize";
import dbConnection from "../config/db.js";

const FollowMosque = dbConnection.define(
  "FollowMosque",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    mosqueId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "followMosques",
    timestamps: true,
    underscored: true,
    indexes: [ // Ensure a user can follow a mosque only once
      {
        unique: true,
        fields: ["user_id", "mosque_id"],
      },
    ],
  }
);

export default FollowMosque;
