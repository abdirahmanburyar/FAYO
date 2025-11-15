import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Using Gmail SMTP (you can change this to any SMTP provider)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER', 'buryar313@gmail.com'),
        pass: this.configService.get('EMAIL_PASS', ''), // App password for Gmail
      },
    });
  }

  async sendOtpEmail(phone: string, otp: string, recipientEmail?: string): Promise<boolean> {
    try {
      const email = recipientEmail || this.configService.get('DEFAULT_EMAIL', 'buryar313@gmail.com');
      
      const mailOptions = {
        from: `"FAYO Healthcare" <${this.configService.get('EMAIL_USER', 'buryar313@gmail.com')}>`,
        to: email,
        subject: 'FAYO Healthcare - OTP Verification Code',
        html: this.generateOtpEmailTemplate(phone, otp),
        text: `Your FAYO verification code is: ${otp}. Valid for 5 minutes.`,
      };

      await this.transporter.sendMail(mailOptions);
      
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send OTP email:', error);
      return false;
    }
  }

  private generateOtpEmailTemplate(phone: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FAYO Healthcare - OTP Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .otp-code {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-number {
            font-size: 32px;
            font-weight: bold;
            color: #2c5aa0;
            letter-spacing: 5px;
            margin: 10px 0;
          }
          .info {
            background-color: #e7f3ff;
            border-left: 4px solid #2c5aa0;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏥 FAYO Healthcare</div>
            <p>Your trusted healthcare companion</p>
          </div>
          
          <h2>OTP Verification Code</h2>
          <p>Hello! You have requested a verification code for your FAYO Healthcare account.</p>
          
          <div class="otp-code">
            <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
            <div class="otp-number">${otp}</div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 5 minutes</p>
          </div>
          
          <div class="info">
            <strong>📱 Phone Number:</strong> ${phone}<br>
            <strong>⏰ Requested at:</strong> ${new Date().toLocaleString()}<br>
            <strong>🔒 Security:</strong> This code is for your account verification only
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0 0 20px;">
              <li>Never share this code with anyone</li>
              <li>FAYO will never ask for your OTP via phone or email</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions or concerns, please contact our support team.</p>
          
          <div class="footer">
            <p>© 2024 FAYO Healthcare. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"FAYO Healthcare" <${this.configService.get('EMAIL_USER', 'buryar313@gmail.com')}>`,
        to: email,
        subject: 'Welcome to FAYO Healthcare!',
        html: this.generateWelcomeEmailTemplate(firstName),
        text: `Welcome to FAYO Healthcare, ${firstName}! We're excited to have you on board.`,
      };

      await this.transporter.sendMail(mailOptions);
      
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send welcome email:', error);
      return false;
    }
  }

  private generateWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FAYO Healthcare</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .welcome-message {
            background-color: #e7f3ff;
            border-left: 4px solid #2c5aa0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .features {
            margin: 30px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .feature-icon {
            font-size: 24px;
            margin-right: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏥 FAYO Healthcare</div>
            <p>Your trusted healthcare companion</p>
          </div>
          
          <div class="welcome-message">
            <h2>Welcome to FAYO Healthcare, ${firstName}!</h2>
            <p>We're excited to have you join our healthcare platform. You now have access to a wide range of healthcare services right at your fingertips.</p>
          </div>
          
          <div class="features">
            <h3>What you can do with FAYO:</h3>
            
            <div class="feature-item">
              <div class="feature-icon">📱</div>
              <div>
                <strong>Book Appointments</strong><br>
                Schedule appointments with qualified doctors
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🔍</div>
              <div>
                <strong>Find Doctors</strong><br>
                Search for doctors by specialty and location
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">💊</div>
              <div>
                <strong>Health Records</strong><br>
                Keep track of your medical history
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🚨</div>
              <div>
                <strong>Emergency Services</strong><br>
                Get immediate help when you need it most
              </div>
            </div>
          </div>
          
          <p>Thank you for choosing FAYO Healthcare. We're here to support your health journey every step of the way.</p>
          
          <div class="footer">
            <p>© 2024 FAYO Healthcare. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
