// testEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function sendTestEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // your app password
      },
      tls: {
        rejectUnauthorized: false, // 👈 ignore self-signed cert for testing
      },
    });

    const info = await transporter.sendMail({
      from: `"EduApp" <${process.env.SMTP_USER}>`,
      to: "jayxolisani@gmail.com", // replace with your real email
      subject: "EduApp Test Email ✅",
      text: "This is a test email from EduApp. If you received it, SMTP works!",
      html: "<h3>This is a test email from EduApp. If you received it, SMTP works!</h3>",
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send test email:", error.message);
  }
}

sendTestEmail();
