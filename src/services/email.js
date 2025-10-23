import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (toEmail, url) => {
  try {
    console.log('📧 Preparing to send verification email to:', toEmail);
    
    // Validate API key is present
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is missing');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey', // ← Literally the string 'apikey'
        pass: process.env.SENDGRID_API_KEY, // Your SendGrid API key
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });

    // Verify connection first
    console.log('🔄 Testing SendGrid connection...');
    await transporter.verify();
    console.log('✅ SendGrid connection successful');

    const mailOptions = {
      from: {
        name: 'EduApp',
        address: 'noreply@eduapp.com' // This can be any email
      },
      to: toEmail,
      subject: 'Verify Your Email - EduApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to EduApp! 👋</h2>
          <p>Please verify your email address to activate your account and start learning.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #007bff; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <code style="background: #f5f5f5; padding: 8px; border-radius: 3px; word-break: break-all;">${url}</code>
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
      text: `Verify your EduApp email by visiting: ${url}`
    };

    console.log('📤 Sending email via SendGrid...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Verification email sent successfully:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
    
  } catch (error) {
    console.error('❌ SendGrid error:', error.message);
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
};
