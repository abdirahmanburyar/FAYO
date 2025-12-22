import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import * as admin from 'firebase-admin';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

export interface SendNotificationOptions {
  userId?: string;
  fcmToken?: string;
  fcmTokens?: string[];
  payload: NotificationPayload;
  priority?: 'high' | 'normal';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly prisma: PrismaService) {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      try {
        let serviceAccount: admin.ServiceAccount | null = null;

        // Method 1: Try to load from file (for development/local)
        const fs = require('fs');
        const path = require('path');
        
        // Try multiple possible paths
        const possiblePaths = [
          path.join(process.cwd(), 'firebase-service-account.json'),
          path.join(__dirname, '../../firebase-service-account.json'),
          path.join(__dirname, '../../../firebase-service-account.json'),
          path.join(process.cwd(), 'services/api-service/firebase-service-account.json'),
        ];
        
        this.logger.log('🔍 [FCM] Looking for Firebase service account file...');
        this.logger.log(`   Current working directory: ${process.cwd()}`);
        this.logger.log(`   __dirname: ${__dirname}`);
        
        let serviceAccountPath: string | null = null;
        for (const filePath of possiblePaths) {
          if (fs.existsSync(filePath)) {
            serviceAccountPath = filePath;
            this.logger.log(`✅ [FCM] Found Firebase service account at: ${filePath}`);
            break;
          } else {
            this.logger.log(`   ❌ Not found: ${filePath}`);
          }
        }

        if (serviceAccountPath) {
          try {
            const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountFile);
            this.logger.log('✅ [FCM] Firebase service account loaded from file');
            this.logger.log(`   Project ID: ${(serviceAccount as any).project_id || (serviceAccount as any).projectId}`);
            this.logger.log(`   Client Email: ${(serviceAccount as any).client_email || (serviceAccount as any).clientEmail}`);
          } catch (fileError) {
            this.logger.error('❌ [FCM] Failed to read Firebase service account file:', fileError);
          }
        } else {
          this.logger.warn('⚠️ [FCM] Firebase service account file not found in any of the checked paths');
        }

        // Method 2: Try environment variable (for production)
        if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            this.logger.log('✅ Firebase service account loaded from environment variable');
          } catch (parseError) {
            this.logger.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError);
          }
        }

        // Initialize Firebase if service account is available
        if (serviceAccount) {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          this.logger.log('✅ Firebase Admin SDK initialized successfully');
        } else {
          this.logger.warn(
            '⚠️ Firebase service account not configured. ' +
            'Place firebase-service-account.json in the api-service root or set FIREBASE_SERVICE_ACCOUNT env variable. ' +
            'Notifications will not work until configured.'
          );
        }
      } catch (error) {
        this.logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
      }
    } else {
      this.firebaseApp = admin.app();
    }
  }

  /**
   * Register or update FCM token for a user
   */
  async registerToken(userId: string, token: string, deviceId?: string, platform?: string) {
    try {
      this.logger.log(`📱 Registering FCM token for user ${userId} (platform: ${platform || 'unknown'})`);
      
      // Check if token already exists
      const existing = await this.prisma.fcmToken.findUnique({
        where: { token },
      });

      if (existing) {
        this.logger.log(`🔄 Updating existing FCM token for user ${userId}`);
        // Update existing token
        const updated = await this.prisma.fcmToken.update({
          where: { token },
          data: {
            userId,
            deviceId,
            platform,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`✅ FCM token updated successfully for user ${userId}`);
        return updated;
      }

      this.logger.log(`➕ Creating new FCM token for user ${userId}`);
      // Create new token
      const created = await this.prisma.fcmToken.create({
        data: {
          userId,
          token,
          deviceId,
          platform,
          isActive: true,
        },
      });
      this.logger.log(`✅ FCM token registered successfully for user ${userId} (token ID: ${created.id})`);
      return created;
    } catch (error) {
      this.logger.error(`❌ Error registering FCM token for user ${userId}:`, error);
      throw new BadRequestException('Failed to register FCM token');
    }
  }

  /**
   * Unregister FCM token (when user logs out or uninstalls app)
   */
  async unregisterToken(token: string) {
    try {
      this.logger.log(`🗑️ Unregistering FCM token: ${token.substring(0, 20)}...`);
      const result = await this.prisma.fcmToken.updateMany({
        where: { token },
        data: { isActive: false },
      });
      this.logger.log(`✅ FCM token unregistered (${result.count} token(s) deactivated)`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error unregistering FCM token:`, error);
    }
  }

  /**
   * Get all active FCM tokens for a user
   */
  async getUserTokens(userId: string): Promise<string[]> {
    this.logger.log(`🔍 Fetching FCM tokens for user ${userId}`);
    const tokens = await this.prisma.fcmToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: { token: true },
    });

    this.logger.log(`📱 Found ${tokens.length} active FCM token(s) for user ${userId}`);
    return tokens.map((t) => t.token);
  }

  /**
   * Send notification to a single user
   */
  async sendToUser(options: SendNotificationOptions) {
    const { userId, payload, priority = 'high' } = options;

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    this.logger.log(`📤 Sending notification to user ${userId}: "${payload.title}"`);
    this.logger.log(`   Body: "${payload.body}"`);
    this.logger.log(`   Type: ${payload.data?.type || 'N/A'}`);
    this.logger.log(`   Priority: ${priority}`);

    const tokens = await this.getUserTokens(userId);
    
    if (tokens.length === 0) {
      this.logger.warn(`⚠️ No FCM tokens found for user ${userId} - notification not sent`);
      return { success: false, message: 'No FCM tokens found' };
    }

    this.logger.log(`📱 Sending to ${tokens.length} device(s) for user ${userId}`);
    return this.sendToTokens({ fcmTokens: tokens, payload, priority });
  }

  /**
   * Send notification to specific FCM tokens
   */
  async sendToTokens(options: SendNotificationOptions) {
    const { fcmTokens, fcmToken, payload, priority = 'high' } = options;

    const tokens = fcmTokens || (fcmToken ? [fcmToken] : []);

    if (tokens.length === 0) {
      throw new BadRequestException('At least one FCM token is required');
    }

    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping notification.');
      return { success: false, message: 'Firebase not initialized' };
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: {
        ...payload.data,
        // Convert all data values to strings (FCM requirement)
        ...Object.fromEntries(
          Object.entries(payload.data || {}).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ])
        ),
      },
      tokens,
      android: {
        priority: priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: 'fayo_healthcare',
          sound: 'default',
          priority: priority === 'high' ? 'high' : 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      this.logger.log(`🚀 Sending FCM notification to ${tokens.length} token(s)`);
      this.logger.log(`   Title: "${payload.title}"`);
      this.logger.log(`   Body: "${payload.body}"`);
      this.logger.log(`   Data: ${JSON.stringify(payload.data)}`);
      
      const response = await admin.messaging().sendEachForMulticast(message);
      
      this.logger.log(
        `✅ FCM Notification sent: ${response.successCount} successful, ${response.failureCount} failed`
      );

      // Log detailed results
      if (response.successCount > 0) {
        this.logger.log(`   ✅ Successfully delivered to ${response.successCount} device(s)`);
      }
      
      if (response.failureCount > 0) {
        this.logger.warn(`   ⚠️ Failed to deliver to ${response.failureCount} device(s)`);
        
        // Log failure details
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(`   ❌ Token ${idx + 1} failed: ${resp.error?.code} - ${resp.error?.message}`);
          }
        });
      }

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
            invalidTokens.push(tokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          await this.prisma.fcmToken.updateMany({
            where: { token: { in: invalidTokens } },
            data: { isActive: false },
          });
          this.logger.log(`🗑️ Removed ${invalidTokens.length} invalid FCM token(s) from database`);
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error('❌ Error sending FCM notification:', error);
      this.logger.error(`   Payload: ${JSON.stringify(payload)}`);
      this.logger.error(`   Token count: ${tokens.length}`);
      throw new BadRequestException('Failed to send notification');
    }
  }

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminder(
    userId: string,
    appointmentId: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentTime: string,
    hoursBefore: number
  ) {
    const timeText = hoursBefore === 24 ? 'tomorrow' : `in ${hoursBefore} hours`;
    
    this.logger.log(`⏰ Sending appointment reminder to user ${userId}`);
    this.logger.log(`   Appointment: ${appointmentId}, Doctor: ${doctorName}, ${hoursBefore}h before`);
    
    return this.sendToUser({
      userId,
      payload: {
        title: 'Appointment Reminder',
        body: `Your appointment with ${doctorName} is ${timeText} at ${appointmentTime}`,
        data: {
          type: 'APPOINTMENT_REMINDER',
          appointmentId,
          hoursBefore: hoursBefore.toString(),
        },
      },
      priority: 'high',
    });
  }

  /**
   * Send appointment confirmation notification
   */
  async sendAppointmentConfirmation(
    userId: string,
    appointmentId: string,
    appointmentNumber: number,
    doctorName: string,
    appointmentDate: Date,
    appointmentTime: string
  ) {
    this.logger.log(`✅ Sending appointment confirmation to user ${userId}`);
    this.logger.log(`   Appointment #${appointmentNumber} with ${doctorName} on ${appointmentDate.toLocaleDateString()}`);
    
    return this.sendToUser({
      userId,
      payload: {
        title: 'Appointment Confirmed',
        body: `Your appointment #${appointmentNumber} with ${doctorName} is confirmed for ${appointmentDate.toLocaleDateString()} at ${appointmentTime}`,
        data: {
          type: 'APPOINTMENT_CONFIRMED',
          appointmentId,
          appointmentNumber: appointmentNumber.toString(),
        },
      },
      priority: 'high',
    });
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(
    userId: string,
    paymentId: string,
    amount: number,
    appointmentId?: string
  ) {
    const amountInDollars = (amount / 100).toFixed(2);
    
    this.logger.log(`💳 Sending payment confirmation to user ${userId}`);
    this.logger.log(`   Payment: ${paymentId}, Amount: $${amountInDollars}`);
    
    return this.sendToUser({
      userId,
      payload: {
        title: 'Payment Confirmed',
        body: `Payment of $${amountInDollars} has been successfully processed`,
        data: {
          type: 'PAYMENT_CONFIRMED',
          paymentId,
          amount: amount.toString(),
          appointmentId: appointmentId || '',
        },
      },
      priority: 'high',
    });
  }

  /**
   * Send appointment cancellation notification
   */
  async sendAppointmentCancellation(
    userId: string,
    appointmentId: string,
    appointmentNumber: number,
    reason?: string
  ) {
    this.logger.log(`❌ Sending appointment cancellation to user ${userId}`);
    this.logger.log(`   Appointment #${appointmentNumber} cancelled${reason ? `: ${reason}` : ''}`);
    
    return this.sendToUser({
      userId,
      payload: {
        title: 'Appointment Cancelled',
        body: `Your appointment #${appointmentNumber} has been cancelled${reason ? `: ${reason}` : ''}`,
        data: {
          type: 'APPOINTMENT_CANCELLED',
          appointmentId,
          appointmentNumber: appointmentNumber.toString(),
        },
      },
      priority: 'high',
    });
  }

  /**
   * Send notification to doctor about new appointment
   */
  async notifyDoctorNewAppointment(
    doctorUserId: string,
    appointmentId: string,
    patientName: string,
    appointmentDate: Date,
    appointmentTime: string
  ) {
    this.logger.log(`👨‍⚕️ Sending new appointment notification to doctor ${doctorUserId}`);
    this.logger.log(`   Patient: ${patientName}, Date: ${appointmentDate.toLocaleDateString()}, Time: ${appointmentTime}`);
    
    return this.sendToUser({
      userId: doctorUserId,
      payload: {
        title: 'New Appointment Request',
        body: `New appointment request from ${patientName} on ${appointmentDate.toLocaleDateString()} at ${appointmentTime}`,
        data: {
          type: 'NEW_APPOINTMENT_REQUEST',
          appointmentId,
          patientName,
        },
      },
      priority: 'high',
    });
  }

  /**
   * Notify users when a new doctor is added to a hospital
   * Sends notification to all patients (users with role PATIENT)
   */
  async notifyNewDoctorAtHospital(
    hospitalId: string,
    hospitalName: string,
    doctorName: string,
    specialty?: string
  ) {
    try {
      this.logger.log(`🏥 Notifying patients about new doctor at hospital`);
      this.logger.log(`   Hospital: ${hospitalName} (${hospitalId})`);
      this.logger.log(`   Doctor: ${doctorName}${specialty ? ` (${specialty})` : ''}`);
      
      // Get all patient users (users who might be interested in new doctors)
      const patients = await this.prisma.user.findMany({
        where: {
          OR: [
            { role: 'PATIENT' },
            { userType: 'PATIENT' },
          ],
          isActive: true,
        },
        select: { id: true },
      });

      this.logger.log(`👥 Found ${patients.length} active patient(s) to notify`);

      if (patients.length === 0) {
        this.logger.warn('⚠️ No patients found to notify about new doctor');
        return { success: false, message: 'No patients found' };
      }

      // Get all FCM tokens for these patients
      const patientIds = patients.map(p => p.id);
      const tokens = await this.prisma.fcmToken.findMany({
        where: {
          userId: { in: patientIds },
          isActive: true,
        },
        select: { token: true },
      });

      this.logger.log(`📱 Found ${tokens.length} active FCM token(s) across ${patients.length} patient(s)`);

      if (tokens.length === 0) {
        this.logger.warn('⚠️ No FCM tokens found for patients - notification not sent');
        return { success: false, message: 'No FCM tokens found' };
      }

      const fcmTokens = tokens.map(t => t.token);
      const specialtyText = specialty ? ` (${specialty})` : '';

      this.logger.log(`📤 Broadcasting new doctor notification to ${fcmTokens.length} device(s)`);

      return this.sendToTokens({
        fcmTokens,
        payload: {
          title: 'New Doctor Available',
          body: `${doctorName}${specialtyText} has joined ${hospitalName}. Book an appointment now!`,
          data: {
            type: 'NEW_DOCTOR_AT_HOSPITAL',
            hospitalId,
            hospitalName,
            doctorName,
            specialty: specialty || '',
          },
        },
        priority: 'normal', // Normal priority for informational notifications
      });
    } catch (error) {
      this.logger.error('❌ Error notifying users about new doctor:', error);
      this.logger.error(`   Hospital: ${hospitalName} (${hospitalId})`);
      this.logger.error(`   Doctor: ${doctorName}`);
      throw new BadRequestException('Failed to send new doctor notification');
    }
  }
}

