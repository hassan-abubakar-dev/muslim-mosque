import helmet from "helmet";
import dotenv from 'dotenv';
dotenv.config();

const security = helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            
            imgSrc: ["'self'", `${process.env.CLOUDINARY_CLOUD_NAME}.cloudinary.com`], 
            
            mediaSrc: ["'self'", process.env.R2_BUCKET_DOMAIN],
            
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"], 
            upgradeInsecureRequests: [],
        },
    },
});

export default security;