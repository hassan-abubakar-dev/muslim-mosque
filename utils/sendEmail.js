import transporter from "../config/nodemailer.js";

 const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Muslim Mosque App" <${process.env.EMAIL_ADDRESS_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email send failed:", error.message);
    throw error;
  }
};


export default sendEmail;