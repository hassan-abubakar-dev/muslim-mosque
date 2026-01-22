import { DataTypes, UUIDV4} from "sequelize";
import dbConnection from "../config/db.js";

const Category = dbConnection.define('Category', {
    id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false  
    },
    teacherName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    information: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mosqueId: {
        type: DataTypes.UUID,
        allowNull: false,
        },
    },
    {
        tableName: 'categories',
        timestamps: true,
        underscored: true
    }
);

export default Category;