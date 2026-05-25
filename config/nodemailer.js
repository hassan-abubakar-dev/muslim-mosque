import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_ADDRESS_USER,
    pass: process.env.EMAIL_ADDRESS_PASSWORD, 
  },
});

// optional (good for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("Mail server error:", error);
  } else {
    console.log("Mail server ready");
  }
});

export default transporter;