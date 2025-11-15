import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { KafkaService } from '../common/kafka/kafka.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { Appointment, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = await this.prisma.appointment.create({
      data: createAppointmentDto,
    });

    // Publish event to Kafka
    await this.kafkaService.publishAppointmentCreated(appointment);

    return appointment;
  }

  async findAll(): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
    });
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findBySpecialty(specialty: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { specialty },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
    });

    // Publish event to Kafka
    await this.kafkaService.publishAppointmentUpdated(appointment);

    return appointment;
  }

  async cancel(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    // Publish event to Kafka
    await this.kafkaService.publishAppointmentUpdated(appointment);

    return appointment;
  }

  async confirm(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
    });

    // Publish event to Kafka
    await this.kafkaService.publishAppointmentUpdated(appointment);

    return appointment;
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.COMPLETED },
    });

    // Publish event to Kafka
    await this.kafkaService.publishAppointmentUpdated(appointment);

    return appointment;
  }

  async getAvailableSlots(doctorId: string, date: Date): Promise<Date[]> {
    // This is a simplified implementation
    // In a real app, you'd check doctor availability, working hours, etc.
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
        },
      },
    });

    // Generate available slots (simplified)
    const slots: Date[] = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slot = new Date(date);
        slot.setHours(hour, minute, 0, 0);
        
        const isBooked = appointments.some(apt => 
          Math.abs(apt.scheduledAt.getTime() - slot.getTime()) < slotDuration * 60000
        );
        
        if (!isBooked) {
          slots.push(slot);
        }
      }
    }

    return slots;
  }
}
