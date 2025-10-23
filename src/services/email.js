export const sendVerificationEmail = async (toEmail, url) => {
  try {
    console.log('🎯 USER REGISTRATION:', toEmail);
    console.log('🔗 VERIFICATION URL:', url);
    
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️ No SendGrid API key configured');
      return { 
        success: true, 
        messageId: `user-created-${Date.now()}`,
        note: 'User registered. Email service not configured.'
      };
    }

    const emailData = {
      personalizations: [{ 
        to: [{ email: toEmail }], 
        subject: 'Verify Your uThando Lwemfundo Account'
      }],
      from: { 
        email: process.env.SENDGRID_FROM_EMAIL || 'jayxolisani@gmail.com',
        name: process.env.SENDGRID_FROM_NAME || 'uThando Lwemfundo'
      },
      reply_to: { 
        email: process.env.SENDGRID_FROM_EMAIL || 'jayxolisani@gmail.com',
        name: 'EduApp Support'
      },
      // ✅ FIXED: Plain text MUST come first, then HTML
      content: [{
        type: 'text/plain',
        value: `Welcome to uThando Lwemfundo!

Thank you for signing up. Please verify your email address by clicking the link below:

${url}

This link will expire in 24 hours for security purposes.

If the link doesn't work, copy and paste it into your browser.

If you didn't create an account, you can safely ignore this email.

— The EduApp Team`
      }, {
        type: 'text/html',
        value: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td align="center" style="padding: 40px 30px; background-color: #007bff; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">EduApp</h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Welcome! 🎉</h2>
                        <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                          Thank you for signing up for EduApp. We're excited to have you on board!
                        </p>
                        <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.6;">
                          Click the button below to verify your email address and activate your account:
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                          <tr>
                            <td align="center" style="border-radius: 6px; background-color: #007bff;">
                              <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                                Verify My Email
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 20px; color: #777777; font-size: 14px; line-height: 1.6;">
                          This verification link will expire in <strong>24 hours</strong> for security purposes.
                        </p>
                        
                        <!-- Alternative Link -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #007bff;">
                          <p style="margin: 0 0 10px; color: #555555; font-size: 13px; font-weight: bold;">
                            Button not working?
                          </p>
                          <p style="margin: 0; color: #777777; font-size: 13px; line-height: 1.6; word-break: break-all;">
                            Copy and paste this link into your browser:<br>
                            <a href="${url}" style="color: #007bff; text-decoration: none;">${url}</a>
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0 0 10px; color: #999999; font-size: 13px; line-height: 1.5;">
                          You're receiving this email because you created an account on EduApp.
                        </p>
                        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                          If you didn't sign up, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      }],
      categories: ['email_verification'],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      }
    };

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ Email sent successfully to:', toEmail);
        return { 
          success: true, 
          messageId: response.headers.get('x-message-id') || `sent-${Date.now()}`,
          note: 'Verification email sent successfully.'
        };
      } else {
        const errorText = await response.text();
        console.error('❌ SendGrid Error:', response.status, errorText);
        
        if (response.status === 403) {
          console.error('⚠️ Sender not verified! Visit: https://app.sendgrid.com/settings/sender_auth');
        }
        
        return { 
          success: true, 
          messageId: `created-${Date.now()}`,
          note: `User registered. Email error: ${response.status}`,
          emailError: errorText
        };
      }
    } catch (emailError) {
      console.error('⚠️ Email sending failed:', emailError.message);
      return { 
        success: true, 
        messageId: `created-${Date.now()}`,
        note: 'User registered. Email service unavailable.',
        emailError: emailError.message
      };
    }
    
  } catch (error) {
    console.error('Registration error:', error.message);
    return { 
      success: true,
      messageId: `created-${Date.now()}`,
      note: 'User created. Check logs for details.'
    };
  }
};
