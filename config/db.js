import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const dbConnection = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT,
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