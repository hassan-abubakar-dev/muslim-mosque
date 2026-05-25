import { DataTypes } from "sequelize";

import dbConnection from "../config/db.js";



const Feedback = dbConnection.define(

  "Feedback",

  {

    id: {

      type: DataTypes.UUID,

      defaultValue: DataTypes.UUIDV4,

      primaryKey: true,

    },



    type: {

      type: DataTypes.ENUM(

        "suggestion",

        "bug",

        "work_inquiry",

        "praise"

      ),

      allowNull: false,

      defaultValue: "suggestion",

    },



    message: {

      type: DataTypes.TEXT,

      allowNull: false,

    },



    // Optional (for reply)

    email: {

      type: DataTypes.STRING,

      allowNull: true,

    },



    contactConsent: {

      type: DataTypes.BOOLEAN,

      defaultValue: false,

    },



    // Optional (if user is logged in)

    userId: {

      type: DataTypes.UUID,
        allowNull: true,

    },



    // Optional but useful (no overengineering)

    status: {

      type: DataTypes.ENUM("pending", "resolved"),

      defaultValue: "pending",

    },

  },

  {

    tableName: "feedbacks",

    timestamps: true,

    underscored: true,

  }

);



export default Feedback;