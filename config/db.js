import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Use the connection string if available (Neon), otherwise use individual variables
const dbConnection = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres', 
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false } // SSL for neon
      }
    })
  : new Sequelize(
      process.env.DATABASE_NAME,
      process.env.DATABASE_USERNAME,
      process.env.DATABASE_PASSWORD,
      {
        host: process.env.DATABASE_HOST,
        dialect: process.env.DATABASE_DIALECT,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      }
    );

// Connection test
(async () => {
  try {
    await dbConnection.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default dbConnection;