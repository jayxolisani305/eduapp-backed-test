export const sendVerificationEmail = async (toEmail, url) => {
  try {
    console.log('📧 Preparing to send verification email to:', toEmail);
    
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is missing');
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email: toEmail }],
          subject: 'Verify Your Email - EduApp'
        }
      ],
      // ✅ USING jayxolisani@gmail.com AS VERIFIED SENDER
      from: {
        email: 'jayxolisani@gmail.com', // ← YOUR VERIFIED EMAIL
        name: 'EduApp'
      },
      content: [
        {
          type: 'text/html',
          value: `
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
          `
        }
      ]
    };

    console.log('📤 Sending email via SendGrid REST API...');
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via SendGrid!');
      return { 
        success: true, 
        messageId: `sg-${Date.now()}`,
        status: response.status
      };
    } else {
      const errorData = await response.json();
      console.error('❌ SendGrid error details:', errorData);
      return { 
        success: false, 
        error: `SendGrid error: ${JSON.stringify(errorData)}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    return { 
      success: false, 
      error: error.message
    };
  }
};
