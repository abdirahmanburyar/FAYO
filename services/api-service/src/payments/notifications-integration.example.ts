/**
 * Example: How to integrate FCM notifications in Payments Service
 * 
 * Add this to your payments.service.ts to send notifications
 * when payments are processed.
 */

import { NotificationsService } from '../notifications/notifications.service';

// In your PaymentsService constructor, inject NotificationsService:
// constructor(
//   private readonly prisma: PrismaService,
//   private readonly notificationsService: NotificationsService, // Add this
//   // ... other dependencies
// ) {}

// Example: Send notification when payment is successful
async createPayment(dto: CreatePaymentDto) {
  // ... create payment logic ...
  
  const payment = await this.prisma.payment.create({ /* ... */ });
  
  // Get user ID from appointment or ad
  let userId: string | undefined;
  
  if (payment.appointmentId) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: payment.appointmentId },
      include: { patient: true },
    });
    userId = appointment?.patient?.id;
  } else if (payment.adId) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: payment.adId },
    });
    // Get user ID from ad creator or payment payer
    userId = payment.paidBy; // Adjust based on your schema
  }
  
  // Send payment confirmation notification
  if (userId) {
    await this.notificationsService.sendPaymentConfirmation(
      userId,
      payment.id,
      payment.amount,
      payment.appointmentId || undefined
    );
  }
  
  return payment;
}

