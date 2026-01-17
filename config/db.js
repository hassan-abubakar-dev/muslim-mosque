import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
const isDevelopment = process.env.NODE_ENV === 'development';

const dbConnection = new Sequelize(
  isDevelopment && process.env.DATABASE_NAME,
  isDevelopment && process.env.DATABASE_USERNAME,
  isDevelopment && process.env.DATABASE_PASSWORD,
  {
    host: isDevelopment && process.env.DATABASE_HOST,
    dialect: isDevelopment && process.env.DATABASE_DIALECT,
    logging: process.env.NODE_ENV === 'development'
        ? true : false
  }
);

(async () => {
  try {
    await dbConnection.authenticate();
    console.log("Database connected successfully.");
    } catch (error) {
    console.error("Unable to connect to the database:", error);
    }   
})();

export default dbConnection;