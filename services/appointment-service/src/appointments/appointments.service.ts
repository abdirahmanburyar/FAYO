import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { DoctorServiceClient } from '../common/clients/doctor-service.client';
import { HospitalServiceClient } from '../common/clients/hospital-service.client';
import { UserServiceClient } from '../common/clients/user-service.client';
import { SpecialtyServiceClient } from '../common/clients/specialty-service.client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { AppointmentGateway } from '../websocket/appointment.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorServiceClient: DoctorServiceClient,
    private readonly hospitalServiceClient: HospitalServiceClient,
    private readonly userServiceClient: UserServiceClient,
    private readonly specialtyServiceClient: SpecialtyServiceClient,
    private readonly rabbitMQService: RabbitMQService,
    private readonly appointmentGateway: AppointmentGateway,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      try {
        console.log('📅 [APPOINTMENT] Creating appointment:', createAppointmentDto);

        // 1. Validate patient exists (with retry logic for newly created patients)
        let patientExists = false;
        let retries = 8;
        let delay = 500;
        let lastError: any = null;
        
        console.log(`🔍 [APPOINTMENT] Validating patient ${createAppointmentDto.patientId}...`);
        
        while (!patientExists && retries > 0) {
          try {
            const user = await this.userServiceClient.getUserById(createAppointmentDto.patientId);
            if (user && user.id && user.id === createAppointmentDto.patientId) {
              patientExists = true;
              console.log(`✅ [APPOINTMENT] Patient ${createAppointmentDto.patientId} validated successfully (${user.firstName || ''} ${user.lastName || ''})`);
              break;
            } else {
              console.warn(`⚠️ [APPOINTMENT] User returned but ID mismatch: expected ${createAppointmentDto.patientId}, got ${user?.id}`);
            }
          } catch (fetchError: any) {
            lastError = fetchError;
            const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
            console.log(`⚠️ [APPOINTMENT] getUserById failed: ${errorMessage}`);
            
            try {
              patientExists = await this.userServiceClient.validateUser(createAppointmentDto.patientId);
              if (patientExists) {
                console.log(`✅ [APPOINTMENT] Patient ${createAppointmentDto.patientId} validated via validateUser`);
                break;
              }
            } catch (validateError) {
              console.log(`⚠️ [APPOINTMENT] validateUser also failed`);
            }
          }
          
          if (!patientExists && retries > 1) {
            console.log(`⏳ [APPOINTMENT] Patient ${createAppointmentDto.patientId} not found yet, retrying in ${delay}ms... (${retries - 1} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.3, 2000);
          }
          
          retries--;
        }
        
        if (!patientExists) {
          const errorDetails = lastError instanceof Error ? lastError.message : String(lastError);
          console.error(`❌ [APPOINTMENT] Patient ${createAppointmentDto.patientId} not found after ${8 - retries} attempts`);
          throw new NotFoundException(
            `Patient not found. Please verify the patient ID (${createAppointmentDto.patientId}) is correct and the patient exists in the system.`
          );
        }

        // 2. Validate doctor exists (if provided)
        if (!createAppointmentDto.doctorId && !createAppointmentDto.hospitalId) {
          throw new BadRequestException('Either doctorId or hospitalId must be provided.');
        }

        let doctor;
        if (createAppointmentDto.doctorId) {
          try {
            doctor = await this.doctorServiceClient.getDoctorById(createAppointmentDto.doctorId);
            if (!doctor || !doctor.id) {
              throw new NotFoundException(`Doctor with ID ${createAppointmentDto.doctorId} not found`);
            }
          } catch (error: any) {
            // Check if it's a throttling error
            if (error?.status === 429 || error?.statusCode === 429) {
              console.error(`❌ [APPOINTMENT] Doctor service rate limit exceeded`);
              throw new BadRequestException(
                'Doctor service is currently busy. Please wait a moment and try again.'
              );
            }
            // Check if it's a 404 or not found error
            if (error?.status === 404 || error?.statusCode === 404 || error?.message?.includes('not found')) {
              throw new NotFoundException(
                `Doctor not found. Please verify the doctor ID (${createAppointmentDto.doctorId}) is correct and the doctor exists in the system.`
              );
            }
            // Check if it's a server error
            if (error?.status >= 500 || error?.statusCode >= 500) {
              throw new BadRequestException(
                'Doctor service is temporarily unavailable. Please try again later.'
              );
            }
            // Generic error
            throw new NotFoundException(
              `Unable to verify doctor. Please check the doctor ID (${createAppointmentDto.doctorId}) and try again.`
            );
          }
        }

        // 3. Validate hospital association or existence
        // IMPORTANT: Consultation fee MUST come from hospital-doctor association when hospital is selected,
        // NOT from the doctor's own consultationFee. This ensures hospital pricing policies are followed.
        let consultationFee: number = 0;
        
        if (createAppointmentDto.hospitalId) {
          if (createAppointmentDto.doctorId) {
            // Doctor is selected - MUST use hospital-doctor association fee from association table
            // NEVER read from doctor.consultationFee - always use hospitalAssociation.consultationFee
            try {
              const hospitalAssociation = await this.hospitalServiceClient.getHospitalDoctorAssociation(
                createAppointmentDto.hospitalId,
                createAppointmentDto.doctorId,
              );
              
              // IMPORTANT: Read consultation fee ONLY from hospital-doctor association table
              // This is the single source of truth for fees when hospital is present
              // Do NOT use doctor.consultationFee or doctor.selfEmployedConsultationFee
              consultationFee = hospitalAssociation.consultationFee ?? 0;
              
              if (hospitalAssociation.status !== 'ACTIVE') {
                throw new BadRequestException(
                  'This doctor is not currently active at the selected hospital. Please choose a different hospital or doctor.'
                );
              }
            } catch (error: any) {
              if (error instanceof BadRequestException) {
                throw error;
              }
              if (error?.status === 404 || error?.statusCode === 404) {
                throw new NotFoundException(
                  `The selected doctor is not associated with the selected hospital. Please verify the hospital and doctor combination.`
                );
              }
              throw new BadRequestException(
                'Unable to verify hospital-doctor association. Please check your selection and try again.'
              );
            }
          } else {
            // No doctor selected - hospital will assign doctor later
            // Fee is 0 until doctor is assigned, then it will use the hospital-doctor association fee
            try {
              await this.hospitalServiceClient.getHospitalById(createAppointmentDto.hospitalId);
              consultationFee = 0; // Wait for doctor assignment, then fee will be set from hospital-doctor association
            } catch (error) {
              throw new NotFoundException(`Hospital with ID ${createAppointmentDto.hospitalId} not found`);
            }
          }
        } else {
          // Self-employed doctor (no hospital) - use doctor's self-employed fee
          // This is guaranteed by the initial check
          consultationFee = doctor.selfEmployedConsultationFee || 0;
          if (consultationFee === 0) {
            throw new BadRequestException(
              'This doctor does not have a consultation fee configured for self-employed appointments. Please contact support.'
            );
          }
        }

        // 4. Validate specialty if provided
        if (createAppointmentDto.specialtyId) {
          try {
            await this.specialtyServiceClient.getSpecialtyById(createAppointmentDto.specialtyId);
          } catch (error: any) {
            throw new NotFoundException(
              `Specialty not found. Please verify the specialty ID (${createAppointmentDto.specialtyId}) is correct.`
            );
          }
        }

        // 5. Check availability (check for conflicts) - within transaction
        let appointmentDateStr = createAppointmentDto.appointmentDate;
        if (appointmentDateStr.includes('T')) {
          appointmentDateStr = appointmentDateStr.split('T')[0];
        }
        const appointmentDateTime = new Date(`${appointmentDateStr}T${createAppointmentDto.appointmentTime}`);
        
        if (isNaN(appointmentDateTime.getTime())) {
          throw new BadRequestException(
            `Invalid appointment date or time. Please check the date (${appointmentDateStr}) and time (${createAppointmentDto.appointmentTime}) and try again.`
          );
        }
        
        // Validate appointment is not in the past
        if (appointmentDateTime < new Date()) {
          throw new BadRequestException(
            'Cannot create an appointment in the past. Please select a future date and time.'
          );
        }
        
        const duration = createAppointmentDto.duration || 30;
        
        // Check for conflicts within the transaction
        // Only check doctor conflicts if doctorId is provided
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
              `This doctor already has an appointment scheduled at ${createAppointmentDto.appointmentTime} on ${appointmentDateStr}. Please choose a different time.`
            );
          }
        }

        // 6. Generate sequential appointment number and create appointment atomically
        const maxAppointment = await tx.appointment.findFirst({
          orderBy: {
            appointmentNumber: 'desc',
          },
          select: {
            appointmentNumber: true,
          },
        });
        
        const nextAppointmentNumber = maxAppointment ? maxAppointment.appointmentNumber + 1 : 1;
        
        // Create appointment atomically within transaction
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

        console.log('✅ [APPOINTMENT] Appointment created:', appointment.id);
        
        return appointment;
      } catch (error) {
        console.error('❌ [APPOINTMENT] Error creating appointment:', error);
        
        // Re-throw known exceptions as-is
        if (error instanceof NotFoundException || 
            error instanceof ConflictException || 
            error instanceof BadRequestException) {
          throw error;
        }
        
        // Handle database errors
        if (error?.code === 'P2002') {
          throw new ConflictException(
            'An appointment with this information already exists. Please check your appointment details.'
          );
        }
        
        // Generic error with helpful message
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
          `Failed to create appointment: ${errorMessage}. Please verify all information and try again.`
        );
      }
    }, {
      timeout: 30000, // 30 second timeout for transaction
    }).then(async (appointment) => {
      // Publish event via WebSocket and RabbitMQ for real-time updates (after transaction succeeds)
      // This ensures events are only published if transaction succeeds
      try {
        await this.publishAppointmentCreatedEvent(appointment);
      } catch (error) {
        // Log but don't fail - event publishing is best effort
        console.error('❌ [APPOINTMENT] Failed to publish appointment event:', error);
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
        // Filter by single date (YYYY-MM-DD) - ignore timezone completely
        // Create date range for the entire day
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

      return appointments;
    } catch (error: any) {
      console.error('❌ [APPOINTMENT] Error fetching appointments:', error);
      console.error('❌ [APPOINTMENT] Error details:', {
        code: error?.code,
        meta: error?.meta,
        message: error?.message,
      });
      
      // Handle Prisma errors
      if (error?.code === 'P2021') {
        // Table does not exist
        throw new Error('Database table not found. Please run migrations: npx prisma migrate deploy');
      }
      
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

      return appointment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch appointment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    try {
      console.log('📝 [APPOINTMENT] Updating appointment:', id, updateAppointmentDto);

      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id },
      });

      if (!existingAppointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      // Handle rescheduling (update date/time)
      const updateData: any = {};
      
      if (updateAppointmentDto.newAppointmentDate && updateAppointmentDto.newAppointmentTime) {
        // Rescheduling - check for conflicts
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
              not: id, // Exclude current appointment
            },
          },
        });

        if (conflictingAppointment) {
          throw new ConflictException('Doctor already has an appointment at this time');
        }

        updateData.appointmentDate = newAppointmentDateTime;
        updateData.appointmentTime = updateAppointmentDto.newAppointmentTime;
      } else if (updateAppointmentDto.appointmentDate && updateAppointmentDto.appointmentTime) {
        // Direct date/time update
        const appointmentDateTime = new Date(`${updateAppointmentDto.appointmentDate}T${updateAppointmentDto.appointmentTime}`);
        updateData.appointmentDate = appointmentDateTime;
        updateData.appointmentTime = updateAppointmentDto.appointmentTime;
      }

      // Handle other fields
      if (updateAppointmentDto.status !== undefined) {
        updateData.status = updateAppointmentDto.status;
        
        // Auto-confirm when payment is PAID
        if (updateAppointmentDto.paymentStatus === 'PAID' && existingAppointment.status === 'PENDING') {
          updateData.status = 'CONFIRMED';
        }
      }

      if (updateAppointmentDto.paymentStatus !== undefined) {
        updateData.paymentStatus = updateAppointmentDto.paymentStatus;
        
        // Auto-confirm when payment is PAID
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

      if (updateAppointmentDto.doctorId !== undefined) {
        // Doctor is being assigned or changed - need to recalculate consultation fee
        const newDoctorId = updateAppointmentDto.doctorId;
        const isDoctorBeingAssigned = !existingAppointment.doctorId && newDoctorId;
        const isDoctorBeingChanged = existingAppointment.doctorId && existingAppointment.doctorId !== newDoctorId;
        
        if (isDoctorBeingAssigned || isDoctorBeingChanged) {
          // Validate doctor exists
          try {
            const doctor = await this.doctorServiceClient.getDoctorById(newDoctorId);
            if (!doctor || !doctor.id) {
              throw new NotFoundException(`Doctor with ID ${newDoctorId} not found`);
            }
            
            // IMPORTANT: Consultation fee MUST come from hospital-doctor association table, NOT from doctor table
            // If appointment has a hospital, we MUST use the hospital-doctor association fee
            if (existingAppointment.hospitalId) {
              try {
                const hospitalAssociation = await this.hospitalServiceClient.getHospitalDoctorAssociation(
                  existingAppointment.hospitalId,
                  newDoctorId,
                );
                
                // Always use hospital-doctor association fee from the association table
                // This is the ONLY source of truth for consultation fees when hospital is present
                updateData.consultationFee = hospitalAssociation.consultationFee ?? 0;
                
                if (hospitalAssociation.status !== 'ACTIVE') {
                  throw new BadRequestException(
                    'This doctor is not currently active at the selected hospital. Please choose a different doctor.'
                  );
                }
                
                console.log(`💰 [APPOINTMENT] Updated consultation fee to ${updateData.consultationFee} from hospital-doctor association table`);
              } catch (error: any) {
                if (error instanceof BadRequestException) {
                  throw error;
                }
                if (error?.status === 404 || error?.statusCode === 404) {
                  throw new NotFoundException(
                    `The selected doctor is not associated with the appointment's hospital. Please verify the doctor is associated with hospital ${existingAppointment.hospitalId}.`
                  );
                }
                throw new BadRequestException(
                  'Unable to verify hospital-doctor association. Please check the doctor selection and try again.'
                );
              }
            } else {
              // No hospital - this is a self-employed appointment
              // Even in this case, we should ideally have a hospital, but if not, use self-employed fee
              // However, the primary requirement is: if hospital exists, ALWAYS use hospital-doctor association
              updateData.consultationFee = doctor.selfEmployedConsultationFee || 0;
              if (updateData.consultationFee === 0) {
                throw new BadRequestException(
                  'This doctor does not have a consultation fee configured for self-employed appointments. Please contact support.'
                );
              }
              console.log(`💰 [APPOINTMENT] Updated consultation fee to ${updateData.consultationFee} (self-employed - no hospital)`);
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

      // Publish WebSocket event for appointment update (especially for date/time changes)
      await this.publishAppointmentUpdatedEvent(updatedAppointment);

      console.log('✅ [APPOINTMENT] Appointment updated:', updatedAppointment.id);
      return updatedAppointment;
    } catch (error) {
      console.error('❌ [APPOINTMENT] Error updating appointment:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to update appointment: ${error instanceof Error ? error.message : String(error)}`);
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

      // Calculate revenue (sum of paid appointments)
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
        revenue, // in cents
        revenueUSD: revenue / 100, // in dollars
      };
    } catch (error: any) {
      console.error('❌ [APPOINTMENT] Error fetching stats:', error);
      console.error('❌ [APPOINTMENT] Error details:', {
        code: error?.code,
        meta: error?.meta,
        message: error?.message,
      });
      
      // Handle Prisma errors
      if (error?.code === 'P2021') {
        // Table does not exist
        throw new Error('Database table not found. Please run migrations: npx prisma migrate deploy');
      }
      
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
      // Broadcast directly via WebSocket
      this.appointmentGateway.broadcastAppointmentCreated(appointment);
      
      // Also publish to RabbitMQ as backup
      await this.rabbitMQService.publishAppointmentCreated(appointment);
      
      console.log('📤 [APPOINTMENT] Published appointment.created event via WebSocket and RabbitMQ');
    } catch (error) {
      // Log error but don't fail the appointment creation
      console.error('❌ [APPOINTMENT] Error publishing appointment event:', error);
    }
  }

  private async publishAppointmentUpdatedEvent(appointment: any) {
    try {
      // Broadcast directly via WebSocket
      this.appointmentGateway.broadcastAppointmentUpdated(appointment);
      
      console.log('📤 [APPOINTMENT] Published appointment.updated event via WebSocket');
    } catch (error) {
      // Log error but don't fail the appointment update
      console.error('❌ [APPOINTMENT] Error publishing appointment updated event:', error);
    }
  }
}

