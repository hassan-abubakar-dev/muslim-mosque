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
import cors from './config/cors.js';
import authRouter from './routes/auth.js';
import verificationRouter from './routes/verification.js';
import mosqueRouter from './routes/mosque.js';
import userRouter from './routes/user.js';
import cookieParser from 'cookie-parser';
import userProfileRouter from './routes/userProfile.js';
import categoryRouter from './routes/category.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;     
 
// Middleware

app.use(express.json()); 
app.use(cors);        
app.use(cookieParser());

// Routes
app.use('/api/auths', authRouter);
app.use('/api/verifications', verificationRouter);
app.use('/api/mosques', mosqueRouter);
app.use('/api/users', userRouter); 
app.use('/api/profiles', userProfileRouter);  
app.use('/api/categories', categoryRouter);

// Error Handling Middleware
app.use(errorHandler); 

(async () => {
  try { 
      
    if(process.env.NODE_ENV === 'development'){            
      // for development use alter to update the existing tables
      await dbConnection.sync();
    } else {
      // for production use sync without alter
      await dbConnection.sync(); 
    };
      await superAdmin();
    console.log("all models sync successfully.");

    } catch (error) {
    console.error("Unable to connect to the database:", error);
    }
})();
app.listen(PORT, () => { 
  console.log(`Server is running on port ${PORT}`);
});

