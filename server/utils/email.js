const { Resend } = require('resend');
const env = require('dotenv')
env.config({path:'./.env'})

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to create beautiful HTML email template for OTP
const createOTPEmailHTML = (otp, firstName = 'User') => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mentorick - Verification Code</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 20px; 
                min-height: 100vh; 
            }
            .email-container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: #ffffff; 
                border-radius: 20px; 
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); 
                overflow: hidden; 
            }
            .header { 
                background: var(--color-primary-500); 
                padding: 40px 30px; 
                text-align: center; 
                color: white; 
            }
            .header h1 { 
                font-size: 32px; 
                font-weight: 700; 
                margin-bottom: 10px; 
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); 
            }
            .header p { 
                color: rgba(255, 255, 255, 0.9); 
                font-size: 16px; 
            }
            .content { 
                padding: 50px 40px; 
                text-align: center; 
            }
            .greeting { 
                font-size: 24px; 
                color: #333333; 
                margin-bottom: 20px; 
                font-weight: 600; 
            }
            .message { 
                font-size: 16px; 
                color: #666666; 
                line-height: 1.6; 
                margin-bottom: 40px; 
            }
            .otp-container { 
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                border-radius: 15px; 
                padding: 30px; 
                margin: 30px 0; 
                box-shadow: 0 10px 25px rgba(238, 90, 36, 0.3); 
            }
            .otp-label { 
                color: #ffffff; 
                font-size: 14px; 
                font-weight: 600; 
                text-transform: uppercase; 
                letter-spacing: 1px; 
                margin-bottom: 15px; 
            }
            .otp-code { 
                font-size: 48px; 
                font-weight: 900; 
                color: #ffffff; 
                letter-spacing: 8px; 
                font-family: 'Courier New', monospace; 
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); 
                margin-bottom: 15px; 
            }
            .otp-timer { 
                color: rgba(255, 255, 255, 0.9); 
                font-size: 14px; 
                font-weight: 500; 
            }
            .instructions { 
                background: #f8f9fa; 
                border-radius: 10px; 
                padding: 25px; 
                margin: 30px 0; 
                border-left: 4px solid #4facfe; 
            }
            .instructions h3 { 
                color: #333333; 
                font-size: 18px; 
                margin-bottom: 15px; 
                font-weight: 600; 
            }
            .instructions p { 
                color: #666666; 
                font-size: 14px; 
                line-height: 1.6; 
            }
            .security-note { 
                background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); 
                border-radius: 10px; 
                padding: 20px; 
                margin: 30px 0; 
            }
            .security-note h4 { 
                color: #d63031; 
                font-size: 16px; 
                margin-bottom: 10px; 
                font-weight: 600; 
            }
            .security-note p { 
                color: #2d3436; 
                font-size: 14px; 
                line-height: 1.5; 
            }
            .footer { 
                background: #2d3436; 
                padding: 30px; 
                text-align: center; 
                color: #b2bec3; 
            }
            .footer p { 
                font-size: 14px; 
                margin-bottom: 10px; 
            }
            @media only screen and (max-width: 600px) {
                .email-container { margin: 10px; border-radius: 15px; }
                .content { padding: 30px 20px; }
                .otp-code { font-size: 36px; letter-spacing: 4px; }
                .header { padding: 30px 20px; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🚀 AO1 Community</h1>
                <p>Welcome to the Future of Innovation</p>
            </div>
            <div class="content">
                <h2 class="greeting">Hello ${firstName}! 👋</h2>
                <p class="message">
                    Welcome to AO1 Community! We're excited to have you join our platform. 
                    To complete your registration, please use the verification code below.
                </p>
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-timer">⏰ Expires in 10 minutes</div>
                </div>
                <div class="instructions">
                    <h3>📝 What's Next?</h3>
                    <p>
                        1. Copy the verification code above<br>
                        2. Return to the registration page<br>
                        3. Enter the code to verify your account<br>
                        4. Set up your username and password
                    </p>
                </div>
                <div class="security-note">
                    <h4>🔒 Security Notice</h4>
                    <p>
                        This code is confidential and should not be shared with anyone. 
                        If you didn't request this verification, please ignore this email.
                    </p>
                </div>
            </div>
            <div class="footer">
                <p>© 2025 AO1 Community. All rights reserved.</p>
                <p>Building the future, one innovation at a time.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Clean & professional HTML email for Forgot Password
const createForgotPasswordEmailHTML = (resetUrl, firstName = 'User') => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f5f7fa;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
          Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }

      .header {
        background: #22c55e;
        padding: 24px;
        text-align: center;
        color: #ffffff;
      }

      .header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
      }

      .content {
        padding: 32px;
        color: #374151;
      }

      .content h2 {
        font-size: 20px;
        margin-bottom: 16px;
        font-weight: 600;
        color: #111827;
      }

      .content p {
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 20px;
        color: #4b5563;
      }

      .button-container {
        text-align: center;
        margin: 32px 0;
      }

      .reset-button {
        display: inline-block;
        background: #22c55e;
        color: #ffffff;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
      }

      .reset-button:hover {
        background: #16a34a;
      }

      .link-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 14px;
        font-size: 13px;
        word-break: break-all;
        color: #1f2937;
      }

      .warning {
        margin-top: 24px;
        padding: 16px;
        background: #dcfce7;
        border-left: 4px solid #22c55e;
        font-size: 14px;
        color: #374151;
      }

      .footer {
        padding: 20px;
        text-align: center;
        font-size: 13px;
        color: #6b7280;
        background: #f9fafb;
      }

      @media (max-width: 600px) {
        .content {
          padding: 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Mentorick</h1>
      </div>

      <div class="content">
        <h2>Hello ${firstName},</h2>

        <p>
          We received a request to reset the password for your AO1 Community account.
          Click the button below to set a new password.
        </p>

        <div class="button-container">
          <a href="${resetUrl}" class="reset-button">
            Reset Password
          </a>
        </div>

        <p>If the button doesn’t work, copy and paste this link into your browser:</p>

        <div class="link-box">${resetUrl}</div>

        <div class="warning">
          This password reset link will expire in <strong>10 minutes</strong>.
          If you did not request a password reset, you can safely ignore this email.
        </div>
      </div>

      <div class="footer">
        © 2025 Mentorick. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};


const sendEmailWithResend = async (option) => {
    try {
        // PREPARE EMAIL OPTIONS FOR RESEND
        console.log("request came")
        const emailOptions = {
            from: process.env.FROM_EMAIL, // Replace with your verified domain
            to: option.email,
            subject: option.subject,
            text: option.message
        };

        // If it's an OTP email, add beautiful HTML template
        if (option.isOTP && option.otp && option.firstName) {
            emailOptions.html = createOTPEmailHTML(option.otp, option.firstName);
        }
        
        // If it's a forgot password email, add beautiful HTML template
        if (option.isForgotPassword && option.resetUrl && option.firstName) {
            emailOptions.html = createForgotPasswordEmailHTML(option.resetUrl, option.firstName);
        }

        // Send email using Resend
        const data = await resend.emails.send(emailOptions);
        console.log(data)
        
        console.log('Email sent successfully:', data);
        return data;

    } catch (error) {
        console.error('Error sending email with Resend:', error);
        throw error;
    }
};

module.exports = sendEmailWithResend;
