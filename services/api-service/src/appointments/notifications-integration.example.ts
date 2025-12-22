/**
 * Example: How to integrate FCM notifications in Appointments Service
 * 
 * Add this to your appointments.service.ts to send notifications
 * when appointments are created, updated, or cancelled.
 */

import { NotificationsService } from '../notifications/notifications.service';

// In your AppointmentsService constructor, inject NotificationsService:
// constructor(
//   private readonly prisma: PrismaService,
//   private readonly notificationsService: NotificationsService, // Add this
//   // ... other dependencies
// ) {}

// Example 1: Send notification when appointment is created
async createAppointment(dto: CreateAppointmentDto) {
  // ... create appointment logic ...
  
  const appointment = await this.prisma.appointment.create({ /* ... */ });
  
  // Send confirmation to patient
  if (appointment.patientId) {
    await this.notificationsService.sendAppointmentConfirmation(
      appointment.patientId,
      appointment.id,
      appointment.appointmentNumber,
      doctorName, // Get from doctor lookup
      new Date(appointment.appointmentDate),
      appointment.appointmentTime
    );
  }
  
  // Notify doctor if assigned
  if (appointment.doctorId) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: appointment.doctorId },
      include: { user: true },
    });
    
    if (doctor?.user?.id) {
      await this.notificationsService.notifyDoctorNewAppointment(
        doctor.user.id,
        appointment.id,
        patientName, // Get from patient lookup
        new Date(appointment.appointmentDate),
        appointment.appointmentTime
      );
    }
  }
  
  return appointment;
}

// Example 2: Send reminder 24 hours before appointment
// Use a cron job or scheduled task for this
async sendAppointmentReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointments = await this.prisma.appointment.findMany({
    where: {
      appointmentDate: {
        gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      patient: true,
      doctor: { include: { user: true } },
    },
  });
  
  for (const appointment of appointments) {
    if (appointment.patient?.id) {
      await this.notificationsService.sendAppointmentReminder(
        appointment.patient.id,
        appointment.id,
        appointment.doctor?.user?.firstName || 'Doctor',
        new Date(appointment.appointmentDate),
        appointment.appointmentTime,
        24 // hours before
      );
    }
  }
}

// Example 3: Send notification when appointment is cancelled
async cancelAppointment(id: string, reason?: string) {
  const appointment = await this.prisma.appointment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
    include: { patient: true, doctor: { include: { user: true } } },
  });
  
  // Notify patient
  if (appointment.patient?.id) {
    await this.notificationsService.sendAppointmentCancellation(
      appointment.patient.id,
      appointment.id,
      appointment.appointmentNumber,
      reason
    );
  }
  
  // Notify doctor
  if (appointment.doctor?.user?.id) {
    await this.notificationsService.sendToUser({
      userId: appointment.doctor.user.id,
      payload: {
        title: 'Appointment Cancelled',
        body: `Appointment #${appointment.appointmentNumber} has been cancelled`,
        data: {
          type: 'APPOINTMENT_CANCELLED',
          appointmentId: appointment.id,
        },
      },
    });
  }
  
  return appointment;
}

