import nodemailer from 'nodemailer';

// Lazy initialization - transporter will be created when first needed
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    console.log('🔧 Initializing email transporter...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Found' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing');
    
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    
    // Verify connection only if credentials exist
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter.verify((error, success) => {
        if (error) {
          console.error('⚠️  SMTP Connection Error:', error.message);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } else {
      console.warn('⚠️  Email credentials not configured - OTP verification disabled');
    }
  }
  
  return transporter;
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise} - Mail info
 */
const sendOTP = async (email, otp) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured');
    }
    
    const mailOptions = {
      from: `"BuildOwn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - BuildOwn',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">BuildOwn</h1>
                      <p style="margin: 10px 0 0 0; color: #a1a1aa; font-size: 14px;">Build Your Dream PC</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
                      <p style="margin: 0 0 30px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Thank you for joining BuildOwn! To complete your registration, please use the following One-Time Password (OTP):
                      </p>
                      
                      <!-- OTP Box -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <div style="background-color: #f4f4f5; border: 2px dashed #d4d4d8; border-radius: 12px; padding: 30px; display: inline-block;">
                              <p style="margin: 0 0 10px 0; color: #71717a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                              <p style="margin: 0; color: #18181b; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                        © 2024 BuildOwn Inc. All rights reserved.<br>
                        This is an automated email, please do not reply.
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
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✉️  OTP Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};


/**
 * Verify email configuration on startup
 */
const verifyEmailConfig = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('✅ Email Service: Configured');
    console.log(`   - User: ${process.env.EMAIL_USER}`);
  } else {
    console.warn('⚠️  Email Service: Credentials missing - OTP verification will be disabled');
  }
};

export { sendOTP, verifyEmailConfig };