import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { SpecialtiesService } from '../specialties/specialties.service';
import { RabbitMQService } from '../common/rabbitmq/rabbitmq.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentGateway } from './appointment.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly doctorService: DoctorsService,
    private readonly hospitalService: HospitalsService,
    private readonly specialtyService: SpecialtiesService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly appointmentGateway: AppointmentGateway,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    return await this.prisma.$transaction(async (tx) => {
      try {
        // 1. Validate patient exists - use direct service call
        let patientExists = false;
        let retries = 8;
        let delay = 500;
        
        while (!patientExists && retries > 0) {
          try {
            const user = await this.userService.findOne(createAppointmentDto.patientId);
            if (user && user.id && user.id === createAppointmentDto.patientId) {
              patientExists = true;
              break;
            }
          } catch (fetchError) {
            // Retry logic
          }
          
          if (!patientExists && retries > 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.3, 2000);
          }
          
          retries--;
        }
        
        if (!patientExists) {
          throw new NotFoundException(
            `Patient not found. Please verify the patient ID (${createAppointmentDto.patientId}) is correct.`
          );
        }

        // 2. Validate doctor exists (if provided) - use direct service call
        if (!createAppointmentDto.doctorId && !createAppointmentDto.hospitalId) {
          throw new BadRequestException('Either doctorId or hospitalId must be provided.');
        }

        let doctor;
        if (createAppointmentDto.doctorId) {
          try {
            doctor = await this.doctorService.findOne(createAppointmentDto.doctorId);
            if (!doctor || !doctor.id) {
              throw new NotFoundException(`Doctor with ID ${createAppointmentDto.doctorId} not found`);
            }
          } catch (error: any) {
            if (error?.status === 404 || error?.statusCode === 404 || error?.message?.includes('not found')) {
              throw new NotFoundException(
                `Doctor not found. Please verify the doctor ID (${createAppointmentDto.doctorId}) is correct.`
              );
            }
            throw error;
          }
        }

        // 3. Validate hospital association or existence - use direct service call
        let consultationFee: number = 0;
        
        if (createAppointmentDto.hospitalId) {
          if (createAppointmentDto.doctorId) {
            // Doctor is selected - MUST use hospital-doctor association fee
            try {
              const hospitalDoctors = await this.hospitalService.getDoctors(createAppointmentDto.hospitalId);
              const hospitalAssociation = hospitalDoctors.find((hd: any) => hd.doctorId === createAppointmentDto.doctorId);
              
              if (!hospitalAssociation) {
                throw new NotFoundException(
                  `The selected doctor is not associated with the selected hospital.`
                );
              }
              
              // consultationFee from getDoctors is in dollars, convert to cents for storage
              const feeInDollars = hospitalAssociation.consultationFee ?? 0;
              consultationFee = Math.round(feeInDollars * 100);
              
              if (hospitalAssociation.status !== 'ACTIVE') {
                throw new BadRequestException(
                  'This doctor is not currently active at the selected hospital.'
                );
              }
            } catch (error: any) {
              if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
              }
              throw new BadRequestException(
                'Unable to verify hospital-doctor association.'
              );
            }
          } else {
            // No doctor selected - hospital will assign doctor later
            try {
              await this.hospitalService.findOne(createAppointmentDto.hospitalId);
              consultationFee = 0;
            } catch (error) {
              throw new NotFoundException(`Hospital with ID ${createAppointmentDto.hospitalId} not found`);
            }
          }
        } else {
          // Self-employed doctor (no hospital) - use doctor's self-employed fee
          consultationFee = doctor?.selfEmployedConsultationFee || 0;
          if (consultationFee === 0) {
            throw new BadRequestException(
              'This doctor does not have a consultation fee configured for self-employed appointments.'
            );
          }
        }

        // 4. Validate specialty if provided - use direct service call
        if (createAppointmentDto.specialtyId) {
          try {
            await this.specialtyService.findOne(createAppointmentDto.specialtyId);
          } catch (error: any) {
            throw new NotFoundException(
              `Specialty not found. Please verify the specialty ID (${createAppointmentDto.specialtyId}) is correct.`
            );
          }
        }

        // 5. Check availability (check for conflicts)
        let appointmentDateStr = createAppointmentDto.appointmentDate;
        if (appointmentDateStr.includes('T')) {
          appointmentDateStr = appointmentDateStr.split('T')[0];
        }
        const appointmentDateTime = new Date(`${appointmentDateStr}T${createAppointmentDto.appointmentTime}`);
        
        if (isNaN(appointmentDateTime.getTime())) {
          throw new BadRequestException(
            `Invalid appointment date or time.`
          );
        }
        
        if (appointmentDateTime < new Date()) {
          throw new BadRequestException(
            'Cannot create an appointment in the past.'
          );
        }
        
        const duration = createAppointmentDto.duration || 30;
        
        // Check for conflicts
        if (createAppointmentDto.doctorId) {
          const conflictingAppointment = await tx.appointment.findFirst({
            where: {
              doctorId: createAppointmentDto.doctorId,
              appointmentDate: appointmentDateTime,
              appointmentTime: createAppointmentDto.appointmentTime,
              status: {
                notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
              },
            },
          });

          if (conflictingAppointment) {
            throw new ConflictException(
              `This doctor already has an appointment scheduled at ${createAppointmentDto.appointmentTime} on ${appointmentDateStr}.`
            );
          }
        }

        // 6. Generate sequential appointment number and create appointment
        const maxAppointment = await tx.appointment.findFirst({
          orderBy: {
            appointmentNumber: 'desc',
          },
          select: {
            appointmentNumber: true,
          },
        });
        
        const nextAppointmentNumber = maxAppointment ? maxAppointment.appointmentNumber + 1 : 1;
        
        const appointment = await tx.appointment.create({
          data: {
            appointmentNumber: nextAppointmentNumber,
            patientId: createAppointmentDto.patientId,
            doctorId: createAppointmentDto.doctorId,
            hospitalId: createAppointmentDto.hospitalId || null,
            specialtyId: createAppointmentDto.specialtyId || null,
            appointmentDate: appointmentDateTime,
            appointmentTime: createAppointmentDto.appointmentTime,
            duration: duration,
            status: 'PENDING',
            consultationType: createAppointmentDto.consultationType || 'IN_PERSON',
            reason: createAppointmentDto.reason || null,
            description: createAppointmentDto.description || null,
            consultationFee: consultationFee,
            paymentStatus: 'PENDING',
            createdBy: createAppointmentDto.createdBy,
          },
        });

        // Convert consultationFee from cents to dollars for API response
        return {
          ...appointment,
          consultationFee: appointment.consultationFee / 100,
        };
      } catch (error) {
        if (error instanceof NotFoundException || 
            error instanceof ConflictException || 
            error instanceof BadRequestException) {
          throw error;
        }
        
        if (error?.code === 'P2002') {
          throw new ConflictException(
            'An appointment with this information already exists.'
          );
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
          `Failed to create appointment: ${errorMessage}`
        );
      }
    }, {
      timeout: 30000,
    }).then(async (appointment) => {
      // Publish event via WebSocket and RabbitMQ
      try {
        await this.publishAppointmentCreatedEvent(appointment);
      } catch (error) {
        // Log but don't fail
      }
      return appointment;
    });
  }

  async findAll(filters?: {
    patientId?: string;
    doctorId?: string;
    hospitalId?: string;
    status?: string;
    paymentStatus?: string;
    date?: string;
  }) {
    try {
      const where: any = {};

      if (filters?.patientId) {
        where.patientId = filters.patientId;
      }
      if (filters?.doctorId) {
        where.doctorId = filters.doctorId;
      }
      if (filters?.hospitalId) {
        where.hospitalId = filters.hospitalId;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
      }
      if (filters?.date) {
        const startDateStr = `${filters.date}T00:00:00`;
        const endDateStr = `${filters.date}T23:59:59.999`;
        where.appointmentDate = {
          gte: new Date(startDateStr),
          lte: new Date(endDateStr),
        };
      }

      const appointments = await this.prisma.appointment.findMany({
        where,
        orderBy: {
          appointmentDate: 'asc',
        },
      });

      // Convert consultationFee from cents to dollars for API response
      return appointments.map(appointment => ({
        ...appointment,
        consultationFee: appointment.consultationFee / 100,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch appointments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findOne(id: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      // Convert consultationFee from cents to dollars for API response
      return {
        ...appointment,
        consultationFee: appointment.consultationFee / 100,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch appointment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    try {
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id },
      });

      if (!existingAppointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      const updateData: any = {};
      
      // Handle rescheduling
      if (updateAppointmentDto.newAppointmentDate && updateAppointmentDto.newAppointmentTime) {
        const newAppointmentDateTime = new Date(`${updateAppointmentDto.newAppointmentDate}T${updateAppointmentDto.newAppointmentTime}`);
        
        const conflictingAppointment = await this.prisma.appointment.findFirst({
          where: {
            doctorId: existingAppointment.doctorId,
            appointmentDate: newAppointmentDateTime,
            appointmentTime: updateAppointmentDto.newAppointmentTime,
            status: {
              notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
            },
            id: {
              not: id,
            },
          },
        });

        if (conflictingAppointment) {
          throw new ConflictException('Doctor already has an appointment at this time');
        }

        updateData.appointmentDate = newAppointmentDateTime;
        updateData.appointmentTime = updateAppointmentDto.newAppointmentTime;
      } else if (updateAppointmentDto.appointmentDate && updateAppointmentDto.appointmentTime) {
        const appointmentDateTime = new Date(`${updateAppointmentDto.appointmentDate}T${updateAppointmentDto.appointmentTime}`);
        updateData.appointmentDate = appointmentDateTime;
        updateData.appointmentTime = updateAppointmentDto.appointmentTime;
      }

      // Handle other fields
      if (updateAppointmentDto.status !== undefined) {
        updateData.status = updateAppointmentDto.status;
      }

      if (updateAppointmentDto.paymentStatus !== undefined) {
        updateData.paymentStatus = updateAppointmentDto.paymentStatus;
        if (updateAppointmentDto.paymentStatus === 'PAID' && existingAppointment.status === 'PENDING') {
          updateData.status = 'CONFIRMED';
        }
      }

      if (updateAppointmentDto.paymentMethod !== undefined) {
        updateData.paymentMethod = updateAppointmentDto.paymentMethod;
      }

      if (updateAppointmentDto.paymentTransactionId !== undefined) {
        updateData.paymentTransactionId = updateAppointmentDto.paymentTransactionId;
      }

      if (updateAppointmentDto.cancelledBy !== undefined) {
        updateData.cancelledBy = updateAppointmentDto.cancelledBy;
        updateData.cancelledAt = new Date();
        updateData.status = 'CANCELLED';
      }

      if (updateAppointmentDto.cancellationReason !== undefined) {
        updateData.cancellationReason = updateAppointmentDto.cancellationReason;
      }

      if (updateAppointmentDto.notes !== undefined) {
        updateData.notes = updateAppointmentDto.notes;
      }

      if (updateAppointmentDto.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      if (updateAppointmentDto.duration !== undefined) {
        updateData.duration = updateAppointmentDto.duration;
      }

      if (updateAppointmentDto.consultationType !== undefined) {
        updateData.consultationType = updateAppointmentDto.consultationType;
      }

      if (updateAppointmentDto.reason !== undefined) {
        updateData.reason = updateAppointmentDto.reason;
      }

      if (updateAppointmentDto.description !== undefined) {
        updateData.description = updateAppointmentDto.description;
      }

      // Handle doctor assignment/change - use direct service call
      if (updateAppointmentDto.doctorId !== undefined) {
        const newDoctorId = updateAppointmentDto.doctorId;
        const isDoctorBeingAssigned = !existingAppointment.doctorId && newDoctorId;
        const isDoctorBeingChanged = existingAppointment.doctorId && existingAppointment.doctorId !== newDoctorId;
        
        if (isDoctorBeingAssigned || isDoctorBeingChanged) {
          try {
            const doctor = await this.doctorService.findOne(newDoctorId);
            if (!doctor || !doctor.id) {
              throw new NotFoundException(`Doctor with ID ${newDoctorId} not found`);
            }
            
            // IMPORTANT: Consultation fee MUST come from hospital-doctor association
            if (existingAppointment.hospitalId) {
              try {
                const hospitalDoctors = await this.hospitalService.getDoctors(existingAppointment.hospitalId);
                const hospitalAssociation = hospitalDoctors.find((hd: any) => hd.doctorId === newDoctorId);
                
                if (!hospitalAssociation) {
                  throw new NotFoundException(
                    `The selected doctor is not associated with the appointment's hospital.`
                  );
                }
                
                updateData.consultationFee = hospitalAssociation.consultationFee ?? 0;
                
                if (hospitalAssociation.status !== 'ACTIVE') {
                  throw new BadRequestException(
                    'This doctor is not currently active at the selected hospital.'
                  );
                }
              } catch (error: any) {
                if (error instanceof BadRequestException || error instanceof NotFoundException) {
                  throw error;
                }
                throw new BadRequestException(
                  'Unable to verify hospital-doctor association.'
                );
              }
            } else {
              // No hospital - self-employed appointment
              updateData.consultationFee = doctor.selfEmployedConsultationFee || 0;
              if (updateData.consultationFee === 0) {
                throw new BadRequestException(
                  'This doctor does not have a consultation fee configured for self-employed appointments.'
                );
              }
            }
          } catch (error: any) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
              throw error;
            }
            throw new NotFoundException(
              `Unable to verify doctor. Please check the doctor ID (${newDoctorId}) and try again.`
            );
          }
        }
        
        updateData.doctorId = newDoctorId;
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: updateData,
      });

      // Publish WebSocket event
      await this.publishAppointmentUpdatedEvent(updatedAppointment);

      return updatedAppointment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to update appointment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAvailableTimeSlots(doctorId: string, date: string): Promise<string[]> {
    try {
      // Parse the date
      let appointmentDateStr = date;
      if (appointmentDateStr.includes('T')) {
        appointmentDateStr = appointmentDateStr.split('T')[0];
      }

      // Get all appointments for this doctor on this date
      const appointments = await this.prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: {
            gte: new Date(`${appointmentDateStr}T00:00:00`),
            lte: new Date(`${appointmentDateStr}T23:59:59`),
          },
          status: {
            notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
          },
        },
        select: {
          appointmentTime: true,
        },
      });

      // Extract taken times (convert to 24-hour format for comparison)
      const takenTimes = new Set<string>();
      appointments.forEach(apt => {
        // Convert time to 24-hour format if needed
        let time24h = apt.appointmentTime;
        if (time24h.includes('AM') || time24h.includes('PM')) {
          // Convert 12-hour to 24-hour
          const parts = time24h.split(' ');
          const timeParts = parts[0].split(':');
          let hour = parseInt(timeParts[0]);
          const minute = timeParts[1];
          const period = parts[1].toUpperCase();
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          time24h = `${hour.toString().padStart(2, '0')}:${minute}`;
        }
        takenTimes.add(time24h);
      });

      // Generate all possible time slots (9:00 AM to 5:00 PM, 30-minute intervals)
      const allTimeSlots: string[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time24h = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Convert to 12-hour format for display
          let displayHour = hour;
          const period = hour >= 12 ? 'PM' : 'AM';
          if (hour > 12) displayHour = hour - 12;
          if (hour === 0) displayHour = 12;
          
          const time12h = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
          
          // Check if this time slot is available
          if (!takenTimes.has(time24h)) {
            allTimeSlots.push(time12h);
          }
        }
      }

      return allTimeSlots;
    } catch (error: any) {
      throw new Error(`Failed to get available time slots: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async remove(id: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      await this.prisma.appointment.delete({
        where: { id },
      });

      return { message: 'Appointment deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete appointment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getStats() {
    try {
      const total = await this.prisma.appointment.count();
      const byStatus = await this.prisma.appointment.groupBy({
        by: ['status'],
        _count: true,
      });
      const byPaymentStatus = await this.prisma.appointment.groupBy({
        by: ['paymentStatus'],
        _count: true,
      });

      const paidAppointments = await this.prisma.appointment.findMany({
        where: {
          paymentStatus: 'PAID',
        },
        select: {
          consultationFee: true,
        },
      });

      const revenue = paidAppointments.reduce((sum, apt) => sum + (apt.consultationFee || 0), 0);

      return {
        total,
        byStatus: byStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        byPaymentStatus: byPaymentStatus.map(item => ({
          paymentStatus: item.paymentStatus,
          count: item._count,
        })),
        revenue,
        revenueUSD: revenue / 100,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async confirm(id: string) {
    return this.update(id, { status: 'CONFIRMED' as any });
  }

  async complete(id: string, notes?: string) {
    return this.update(id, { status: 'COMPLETED' as any, notes });
  }

  async cancel(id: string, cancelledBy: string, reason?: string) {
    return this.update(id, {
      status: 'CANCELLED' as any,
      cancelledBy,
      cancellationReason: reason,
    });
  }

  async reschedule(id: string, newDate: string, newTime: string) {
    return this.update(id, {
      newAppointmentDate: newDate,
      newAppointmentTime: newTime,
    } as any);
  }

  private async publishAppointmentCreatedEvent(appointment: any) {
    try {
      this.appointmentGateway.broadcastAppointmentCreated(appointment);
      await this.rabbitMQService.publishAppointmentCreated(appointment);
    } catch (error) {
      // Log but don't fail
    }
  }

  private async publishAppointmentUpdatedEvent(appointment: any) {
    try {
      this.appointmentGateway.broadcastAppointmentUpdated(appointment);
      await this.rabbitMQService.publishAppointmentUpdated(appointment);
    } catch (error) {
      // Log but don't fail
    }
  }
}

