import express from 'express';
import dotenv from 'dotenv';

import dbConnection from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import superAdmin from './config/superAdmin.js';
import './models/relationship.js'
import User from './models/user.js';
import userProfile from './models/userProfile.js';
import Mosque from './models/mosque.js';
import mosqueProfile from './models/mosqueProfile.js';

import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;  
 

app.use(express.json());   

app.use('/api/auth', authRouter);
app.use(errorHandler);

(async () => {
  try { 
      
    await dbConnection.sync();  
      await superAdmin();
    console.log("all models sync successfully.");
    
    } catch (error) {
    console.error("Unable to connect to the database:", error);
    }
})();
app.listen(PORT, () => { 
  console.log(`Server is running on port ${PORT}`);
});

