import { DataTypes } from "sequelize";
import dbConnection from "../config/db.js";

const User = dbConnection.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    firstName: {
        type: DataTypes.STRING(35),
        allowNull: false,
    },
    surName: {
        type: DataTypes.STRING(35),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'superAdmin'),
        defaultValue: 'user'
    },
    isVerify: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},
    {
        tableName: 'users',
        timestamps: true,
        underscored: true
    }
);

export default User;

