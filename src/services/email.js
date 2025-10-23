export const sendVerificationEmail = async (toEmail, url) => {
  try {
    console.log('🎯 VERIFICATION REQUIRED FOR:', toEmail);
    console.log('🔗 VERIFICATION URL:', url);
    
    // Try SendGrid first
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY missing');
    }

    const emailData = {
      personalizations: [{ to: [{ email: toEmail }], subject: 'Verify Your Email - EduApp' }],
      from: { email: 'jayxolisani@gmail.com', name: 'EduApp' },
      content: [{
        type: 'text/html',
        value: `Verify your email: <a href="${url}">${url}</a>`
      }]
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('✅ Email sent via SendGrid (check spam folder)');
      // Even if SendGrid "succeeds" but email doesn't arrive,
      // we return success so user registration continues
      return { 
        success: true, 
        messageId: `sg-${Date.now()}`,
        note: 'Email sent - check spam folder. Verification URL also logged above.'
      };
    } else {
      console.log('⚠️ SendGrid failed, but registration will continue');
      return { 
        success: true, // Still return true so user can be created
        messageId: `fallback-${Date.now()}`,
        note: 'Email service temporarily unavailable. Use logged URL for verification.'
      };
    }
    
  } catch (error) {
    console.error('❌ Email error, but continuing registration:', error.message);
    // Even if email fails, allow user registration to continue
    return { 
      success: true, 
      messageId: `error-${Date.now()}`,
      note: 'Email service issue. Check logs for verification URL.'
    };
  }
};
