import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const corsOptions = {
    origin: [
        process.env.Local_Client,   
        process.env.Production_Client
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

export default cors(corsOptions);