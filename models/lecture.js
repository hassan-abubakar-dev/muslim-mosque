// models/Lecture.js
import { DataTypes } from "sequelize";
import dbConnection from "../config/db.js";
import { DeleteBucketReplication$ } from "@aws-sdk/client-s3";

const Lecture = dbConnection.define(
  "Lecture",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("audio", "video"),
      allowNull: false,
    },

    fileKey: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER, // duration in seconds
      allowNull: true,
    },

    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "lectures",
    timestamps: true,
  }
);

export default Lecture;
