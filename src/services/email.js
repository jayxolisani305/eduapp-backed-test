import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (toEmail, url) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false 
      }
    });

    const info = await transporter.sendMail({
      from: `"EduApp" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Verify your email",
      html: `<p>Click this link to verify your email:</p><a href="${url}">${url}</a>`
    });

    console.log("Verification email sent:", info.messageId);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }
};
