# Appointment Service Design Document

## Overview
The appointment service will handle scheduling, management, and tracking of medical appointments between patients and doctors (both self-employed and hospital-associated).

## 1. Appointment Creation
- **Who can create:**
  - **Admin** (can book on behalf of patients)
  - **Patient** (self-booking)
- **Appointment Types:**
  - With a **self-employed doctor** (direct booking)
  - At a **hospital** (with a specific doctor at that hospital)

## 2. Appointment Data Model

### Core Fields:
- `id` (String, cuid)
- `patientId` (String, FK to user-service) - **Required**
- `doctorId` (String, FK to doctor-service) - **Required**
- `hospitalId` (String?, FK to hospital-service) - **Optional** (only if doctor is hospital-associated)
- `specialtyId` (String?, FK to specialty-service) - **Optional** (for filtering/reporting)
- `appointmentDate` (DateTime) - **Required**
- `appointmentTime` (String) - **Required** (e.g., "09:00")
- `duration` (Int, minutes) - **Required** (default: 30)
- `status` (Enum) - **Required** (see statuses below)
- `consultationType` (Enum) - **Required** (IN_PERSON, VIDEO, PHONE)
- `reason` (String?) - **Optional** (patient's reason for visit)
- `description` (String?) - **Optional** (additional notes)
- `consultationFee` (Int, cents) - **Required** (pre-calculated based on doctor/hospital)
- `paymentStatus` (Enum) - **Required** (PENDING, PAID, REFUNDED)
- `paymentMethod` (String?) - **Optional** (for tracking)
- `paymentTransactionId` (String?) - **Optional** (for payment gateway integration)
- `createdBy` (String) - **Required** (ADMIN or PATIENT - who created it)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `cancelledAt` (DateTime?)
- `cancelledBy` (String?) - **Optional** (who cancelled)
- `cancellationReason` (String?) - **Optional**
- `completedAt` (DateTime?)
- `notes` (String?) - **Optional** (doctor's notes after appointment)

### Status Enum:
- `PENDING` - Just created, awaiting confirmation
- `CONFIRMED` - Confirmed by doctor/hospital
- `COMPLETED` - Appointment finished
- `CANCELLED` - Cancelled (by patient, doctor, or admin)
- `NO_SHOW` - Patient didn't show up
- `RESCHEDULED` - Appointment was rescheduled (old appointment)

### Consultation Type Enum:
- `IN_PERSON` - Physical visit
- `VIDEO` - Video call consultation
- `PHONE` - Phone call consultation

### Payment Status Enum:
- `PENDING` - Payment not yet completed (appointment not confirmed)
- `PAID` - Payment completed (pre-paid)
- `REFUNDED` - Payment refunded (for cancellations)

## 3. Service Architecture

### Separate `appointment-service`
- **Port:** 3005
- **Database:** PostgreSQL (schema: `appointments`)
- **Dependencies:**
  - `user-service` (for patient/doctor validation)
  - `doctor-service` (for doctor details, availability)
  - `hospital-service` (for hospital associations, schedules)
  - `specialty-service` (for specialty filtering)

### API Endpoints:

#### Patient Endpoints:
- `POST /api/v1/appointments` - Create appointment (self-booking)
- `GET /api/v1/appointments/patient/:patientId` - Get patient's appointments
- `PATCH /api/v1/appointments/:id/cancel` - Cancel appointment (patient)
- `PATCH /api/v1/appointments/:id/reschedule` - Reschedule appointment

#### Admin Endpoints:
- `POST /api/v1/appointments` - Create appointment (on behalf of patient)
- `GET /api/v1/appointments` - List all appointments (with filters)
- `GET /api/v1/appointments/:id` - Get appointment details
- `PATCH /api/v1/appointments/:id` - Update appointment
- `PATCH /api/v1/appointments/:id/confirm` - Confirm appointment
- `PATCH /api/v1/appointments/:id/complete` - Mark as completed
- `PATCH /api/v1/appointments/:id/cancel` - Cancel appointment (admin)
- `GET /api/v1/appointments/stats` - Get statistics

#### Doctor Endpoints:
- `GET /api/v1/appointments/doctor/:doctorId` - Get doctor's appointments
- `PATCH /api/v1/appointments/:id/confirm` - Confirm appointment
- `PATCH /api/v1/appointments/:id/complete` - Mark as completed
- `PATCH /api/v1/appointments/:id/cancel` - Cancel appointment (doctor)

#### Hospital Endpoints:
- `GET /api/v1/appointments/hospital/:hospitalId` - Get hospital's appointments

## 4. Business Logic

### Appointment Creation:
1. Validate patient exists (check user-service)
2. Validate doctor exists (check doctor-service)
3. If `hospitalId` provided:
   - Validate doctor is associated with that hospital
   - Get consultation fee from `HospitalDoctor.consultationFee`
4. If no `hospitalId` (self-employed):
   - Get consultation fee from `Doctor.selfEmployedConsultationFee`
5. Check doctor availability:
   - Check doctor's working schedule (from hospital association or self-employed hours)
   - Check for existing appointments at that time
   - Check for blocked time slots
6. Calculate total fee (consultationFee * duration factor if needed)
7. Create appointment with status `PENDING` and payment status `PENDING`
8. Return appointment with payment details

### Payment Flow (Pre-paid):
1. Patient/Admin creates appointment → Status: `PENDING`, Payment: `PENDING`
2. Payment is processed (separate payment service or integration)
3. On payment success → Update payment status to `PAID`
4. Appointment status can be updated to `CONFIRMED` (manually or automatically)

### Availability Checking:
- Check doctor's working days and hours (from hospital association or self-employed schedule)
- Check existing appointments for time conflicts
- Consider buffer time between appointments (e.g., 15 minutes)
- Check for blocked dates/times (holidays, doctor unavailability)

### Rescheduling:
- Create new appointment with same details but new date/time
- Mark old appointment as `RESCHEDULED`
- Handle payment transfer/refund if needed

### Cancellation:
- Update status to `CANCELLED`
- Record cancellation reason and who cancelled
- Handle refund if payment was made (pre-paid)

## 5. Database Schema

```prisma
model Appointment {
  id                    String            @id @default(cuid())
  patientId             String            // FK to user-service
  doctorId              String            // FK to doctor-service
  hospitalId            String?           // FK to hospital-service (optional)
  specialtyId           String?           // FK to specialty-service (optional)
  appointmentDate       DateTime          // Date of appointment
  appointmentTime       String            // Time in HH:MM format
  duration              Int               @default(30) // minutes
  status                AppointmentStatus @default(PENDING)
  consultationType      ConsultationType @default(IN_PERSON)
  reason                String?
  description           String?
  consultationFee       Int               // in cents
  paymentStatus         PaymentStatus     @default(PENDING)
  paymentMethod         String?
  paymentTransactionId String?
  createdBy             String            // ADMIN or PATIENT
  cancelledAt           DateTime?
  cancelledBy           String?
  cancellationReason    String?
  completedAt           DateTime?
  notes                 String?           // Doctor's notes
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  @@index([patientId])
  @@index([doctorId])
  @@index([hospitalId])
  @@index([appointmentDate])
  @@index([status])
  @@map("appointments")
  @@schema("appointments")
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED

  @@schema("appointments")
}

enum ConsultationType {
  IN_PERSON
  VIDEO
  PHONE

  @@schema("appointments")
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED

  @@schema("appointments")
}
```

## 6. Integration Points

### With Doctor Service:
- Get doctor details and availability
- Get self-employed consultation fee
- Check doctor's working schedule

### With Hospital Service:
- Get hospital-doctor association details
- Get consultation fee for hospital appointments
- Get doctor's schedule at hospital

### With User Service:
- Validate patient exists
- Get patient details for appointment display

### With Specialty Service:
- Filter appointments by specialty
- Get specialty details for reporting

## 7. Admin Panel Features

### Appointment Management:
- View all appointments (with filters)
- Create appointments (on behalf of patients)
- Filter by:
  - Date range
  - Doctor
  - Hospital
  - Patient
  - Status
  - Payment status
- Cancel/Reschedule appointments
- Mark as completed
- View statistics:
  - Total appointments
  - By status
  - By doctor
  - By hospital
  - Revenue (from paid appointments)

## 8. Future Considerations

### Notifications:
- Appointment reminders (SMS/Email)
- Confirmation notifications
- Cancellation notifications

### Video Call Integration:
- If consultation type is VIDEO, integrate with video call service
- Generate meeting links/credentials

### Payment Gateway:
- Integrate with payment provider
- Handle refunds automatically

### Calendar Integration:
- Export appointments to calendar
- Sync with external calendars

## 9. Implementation Steps

1. Create `appointment-service` structure
2. Set up Prisma schema and database
3. Implement appointment creation logic
4. Implement availability checking
5. Implement appointment management (CRUD)
6. Add admin panel UI
7. Add filtering and search
8. Add statistics/reporting
9. Integrate with other services
10. Add payment integration (if needed)

