import express from 'express';
import dotenv from 'dotenv';

import dbConnection from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import superAdmin from './config/superAdmin.js';
import './models/relationship.js'
import cors from './config/cors.js';
import authRouter from './routes/auth.js';
import verificationRouter from './routes/verification.js';
import mosqueRouter from './routes/mosque.js';
import userRouter from './routes/user.js';
import cookieParser from 'cookie-parser';
import userProfileRouter from './routes/userProfile.js';
import categoryRouter from './routes/category.js'; 
import mosqueProfileRouter from './routes/mosqueProfile.js';
import quranRouter from './routes/quran.js';
import adzkarRouter from './routes/adzkar.js';
import lectureRouter from './routes/lecture.js';
import signedUrlRouter from './routes/r2.js'
import announcementRouter from './routes/announcement.js';
import feedbackRouter from './routes/feedback.js';
import notificationRouter from './routes/notification.js';
import bookmarkRouter from './routes/bookmark.js';
import videoLibraryRouter from './routes/videoLibrary.js';
import mosqueAdminRouter from './routes/mosqueAdmin.js';
import reportRouter from './routes/report.js'
import superAdminRouter from './routes/superAdmin.js';

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
app.use('/api/profiles', mosqueProfileRouter);  
app.use('/api/categories', categoryRouter);
app.use('/api/quran', quranRouter);
app.use('/api/adzkar', adzkarRouter);
app.use('/api/lectures', lectureRouter);
app.use('/api/signed-url', signedUrlRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/video-library', videoLibraryRouter);
app.use('/api/mosque-admin', mosqueAdminRouter);
app.use('/api/reports', reportRouter);
app.use('/api/super-admin', superAdminRouter);
// Error Handling Middleware
app.use(errorHandler); 



(async () => {
  try { 
      
    if(process.env.NODE_ENV === 'development'){            
      // for development use alter to update the existing tables
      await dbConnection.sync({ alter: true});  
    
  console.log(`Database Dialect detected as: ${dbConnection.getDialect()}`);

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

