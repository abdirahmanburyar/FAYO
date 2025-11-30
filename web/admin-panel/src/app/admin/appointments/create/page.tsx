'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Stethoscope,
  Building2,
  DollarSign,
  FileText,
  Save,
  AlertCircle,
  Phone,
  Video,
  Monitor,
  CheckCircle,
  X
} from 'lucide-react';
import { appointmentsApi, CreateAppointmentDto, ConsultationType, type Appointment } from '@/services/appointmentsApi';
import { usersApi } from '@/services/usersApi';
import type { User } from '@/services/usersApi';
import { doctorApi } from '@/services/doctorApi';
import type { Doctor } from '@/services/doctorApi';
import { hospitalApi } from '@/services/hospitalApi';
import type { Hospital } from '@/services/hospitalApi';
import { SearchableSelect, SelectOption } from '@/components/ui';
import { API_CONFIG } from '@/config/api';

interface AppointmentFormData {
  // Patient Information
  patientFullName: string;
  patientPhone: string;
  patientId: string; // Will be set after finding or creating patient
  
  // Appointment Information
  doctorId?: string;
  hospitalId: string;
  specialtyId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  consultationType: ConsultationType;
  reason: string;
  description: string;
}

// Helper function to check if shift is ongoing
const checkIfShiftOngoing = (startTime?: string, endTime?: string): boolean => {
  if (!startTime || !endTime) return false;
  
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const [currentH, currentM] = currentTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const currentMinutes = currentH * 60 + currentM;
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

export default function CreateAppointmentPage() {
  const router = useRouter();
  const [bookingMethod, setBookingMethod] = useState<'DOCTOR' | 'HOSPITAL'>('DOCTOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientFullName: '',
    patientPhone: '',
    patientId: '',
    doctorId: '',
    hospitalId: '',
    specialtyId: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    consultationType: 'IN_PERSON',
    reason: '',
    description: '',
  });

  // Options for dropdowns
  const [doctors, setDoctors] = useState<SelectOption[]>([]);
  const [allHospitals, setAllHospitals] = useState<SelectOption[]>([]);
  const [doctorHospitals, setDoctorHospitals] = useState<SelectOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [foundPatient, setFoundPatient] = useState<User | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedHospitalDoctor, setSelectedHospitalDoctor] = useState<any>(null); // HospitalDoctor association
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [isSelfEmployed, setIsSelfEmployed] = useState<boolean>(false);
  const [isShiftOngoing, setIsShiftOngoing] = useState<boolean>(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to check if shift is ongoing
  const checkIfShiftOngoing = (startTime?: string, endTime?: string): boolean => {
    if (!startTime || !endTime) return false;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [currentH, currentM] = currentTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = currentH * 60 + currentM;
    
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  // Loading states
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctorHospitals, setLoadingDoctorHospitals] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState<SelectOption[]>([]);

  // Filter doctors when hospital is selected in HOSPITAL mode
  useEffect(() => {
    if (bookingMethod === 'HOSPITAL' && formData.hospitalId) {
      // In a real app, we would fetch doctors for this specific hospital
      // For now, we'll use the doctors list and filter if we had hospital association data
      // Or we can fetch hospital doctors endpoint
      const fetchHospitalDoctors = async () => {
        try {
          setLoadingDoctors(true);
          // Use the correct endpoint to get doctors of a hospital
          const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${formData.hospitalId}/doctors`, {
             headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const hospitalDoctors = await response.json();
            // Filter doctors list to only those in this hospital
            const doctorIds = new Set(hospitalDoctors.map((hd: any) => hd.doctorId));
            const filtered = doctors.filter(d => doctorIds.has(d.value));
            setFilteredDoctors(filtered);
          } else {
            // Fallback if endpoint fails or not implemented
            setFilteredDoctors(doctors); 
          }
        } catch (error) {
          console.error('Error fetching hospital doctors:', error);
          setFilteredDoctors(doctors);
        } finally {
          setLoadingDoctors(false);
        }
      };
      
      fetchHospitalDoctors();
    } else {
      setFilteredDoctors(doctors);
    }
  }, [bookingMethod, formData.hospitalId, doctors]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const doctorsData = await doctorApi.getDoctors();
        setDoctors(doctorsData.map(d => ({
          value: d.id,
          label: `${d.user?.firstName || ''} ${d.user?.lastName || ''} (${d.licenseNumber})`.trim() || d.id,
        })));
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch all hospitals (for reference, but we'll filter by doctor's hospitals)
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const hospitalsData = await hospitalApi.getHospitals();
        setAllHospitals(hospitalsData.map(h => ({
          value: h.id,
          label: `${h.name} (${h.type})`,
        })));
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      } finally {
        setLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, []);

  // Fetch doctor's hospitals when doctor is selected
  useEffect(() => {
    const fetchDoctorHospitals = async () => {
      if (!formData.doctorId) {
        setDoctorHospitals([]);
        setSelectedHospitalDoctor(null);
        return;
      }

      try {
        setLoadingDoctorHospitals(true);
        const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/doctors/${formData.doctorId}/hospitals`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch doctor hospitals: ${response.statusText}`);
        }

        const hospitalAssociations = await response.json();
        console.log('🏥 [APPOINTMENT] Doctor hospitals:', hospitalAssociations);

        // Filter only active associations
        const activeAssociations = hospitalAssociations.filter((ha: any) => ha.status === 'ACTIVE');
        
        // Determine if doctor is self-employed (no hospital associations)
        const hasHospitalAssociations = activeAssociations.length > 0;
        setIsSelfEmployed(!hasHospitalAssociations);
        
        // Create hospital options from doctor's hospitals
        const hospitalOptions = activeAssociations.map((ha: any) => ({
          value: ha.hospitalId,
          label: `${ha.hospital?.name || 'Unknown'} (${ha.hospital?.type || ''})`,
          hospitalDoctor: ha, // Store the association for time slot calculation
        }));

        setDoctorHospitals(hospitalOptions);

        // If doctor has no hospital associations, it's self-employed
        if (!hasHospitalAssociations) {
          setFormData(prev => ({ ...prev, hospitalId: '' }));
          setSelectedHospital(null);
          setSelectedHospitalDoctor(null);
          setIsShiftOngoing(false);
          // Use self-employed fee
          if (selectedDoctor) {
            setConsultationFee(selectedDoctor.selfEmployedConsultationFee || 0);
          }
        } else if (formData.hospitalId) {
          // Doctor has hospitals and one is selected
          const association = activeAssociations.find((ha: any) => ha.hospitalId === formData.hospitalId);
          setSelectedHospitalDoctor(association || null);
          
          if (association) {
            // Check if shift is ongoing
            const shiftOngoing = checkIfShiftOngoing(association.startTime, association.endTime);
            setIsShiftOngoing(shiftOngoing);
            
            // Use hospital consultation fee (follow hospital policy)
            setConsultationFee(association.consultationFee || 0);
          }
        } else {
          // Doctor has hospitals but none selected - still self-employed for this appointment
          setSelectedHospitalDoctor(null);
          setIsShiftOngoing(false);
          if (selectedDoctor) {
            setConsultationFee(selectedDoctor.selfEmployedConsultationFee || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching doctor hospitals:', error);
        setDoctorHospitals([]);
      } finally {
        setLoadingDoctorHospitals(false);
      }
    };

    fetchDoctorHospitals();
  }, [formData.doctorId]);

  // Load doctor details when doctor is selected
  useEffect(() => {
    const loadDoctorDetails = async () => {
      if (formData.doctorId) {
        try {
          const doctor = await doctorApi.getDoctorById(formData.doctorId);
          setSelectedDoctor(doctor);
          
          // Consultation fee will be set by hospital selection effect or default to self-employed
          // Don't set it here to avoid race conditions
          if (!formData.hospitalId) {
            // Only set self-employed fee if no hospital is selected
            setConsultationFee(doctor.selfEmployedConsultationFee || 0);
          }
        } catch (error) {
          console.error('Error loading doctor details:', error);
        }
      } else {
        setSelectedDoctor(null);
        setConsultationFee(0);
      }
    };
    loadDoctorDetails();
  }, [formData.doctorId]);

  // Normalize phone number for comparison (remove +, spaces, dashes, etc.)
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digit characters except leading +
    let normalized = phone.trim();
    // Remove +, spaces, dashes, parentheses
    normalized = normalized.replace(/[\s\-\(\)\+]/g, '');
    // If it starts with country code like 252, keep it; otherwise just digits
    return normalized;
  };

  // Search for patient by phone when phone is entered (using LIKE matching for different formats)
  const searchPatientByPhone = async (phone: string) => {
    if (!phone || phone.trim().length < 3) {
      setFoundPatient(null);
      setFormData(prev => ({ ...prev, patientId: '' }));
      return;
    }

    try {
      setSearchingPatient(true);
      const users = await usersApi.getUsers();
      const normalizedSearchPhone = normalizePhoneNumber(phone);
      
      // Find patient by matching normalized phone numbers
      const patient = users.find(u => {
        if (u.role !== 'PATIENT' || !u.phone) return false;
        const normalizedUserPhone = normalizePhoneNumber(u.phone);
        // Match if normalized phones are equal
        // Also check if one contains the other (for cases like 907022731 vs 252907022731)
        return normalizedUserPhone === normalizedSearchPhone ||
               normalizedUserPhone.endsWith(normalizedSearchPhone) ||
               normalizedSearchPhone.endsWith(normalizedUserPhone);
      });
      
      if (patient) {
        setFoundPatient(patient);
        setFormData(prev => ({ ...prev, patientId: patient.id }));
      } else {
        setFoundPatient(null);
        setFormData(prev => ({ ...prev, patientId: '' }));
      }
    } catch (error) {
      console.error('Error searching for patient:', error);
      setFoundPatient(null);
      setFormData(prev => ({ ...prev, patientId: '' }));
    } finally {
      setSearchingPatient(false);
    }
  };

  // Generate username from full name for new patient
  const generateUsernameFromFullName = async (fullName: string): Promise<string> => {
    try {
      // Convert full name to username format: lowercase, remove spaces, keep only alphanumeric
      let baseUsername = fullName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '') // Remove all spaces
        .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only letters and numbers
      
      // If username is empty after processing, use a fallback
      if (!baseUsername || baseUsername.length === 0) {
        baseUsername = 'patient';
      }
      
      // Check if username already exists
      const users = await usersApi.getUsers();
      const existingUsernames = new Set(users.map(u => u.username?.toLowerCase()).filter(Boolean));
      
      let username = baseUsername;
      let counter = 1;
      
      // If username exists, append a number
      while (existingUsernames.has(username.toLowerCase())) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      return username;
    } catch (error) {
      console.error('Error generating username:', error);
      // Fallback: use timestamp
      return `patient${Date.now().toString().slice(-6)}`;
    }
  };

  // Load hospital details and association when hospital is selected
  useEffect(() => {
    const loadHospitalDetails = async () => {
      if (formData.hospitalId && formData.doctorId && !isSelfEmployed) {
        try {
          const hospital = await hospitalApi.getHospitalById(formData.hospitalId);
          setSelectedHospital(hospital);
          
          // Find the hospital-doctor association
          const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/doctors/${formData.doctorId}/hospitals`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const associations = await response.json();
            const association = associations.find((ha: any) => ha.hospitalId === formData.hospitalId && ha.status === 'ACTIVE');
            setSelectedHospitalDoctor(association || null);
            
            if (association) {
              // Check if shift is ongoing
              const shiftOngoing = checkIfShiftOngoing(association.startTime, association.endTime);
              setIsShiftOngoing(shiftOngoing);
              
              // Use hospital consultation fee (follow hospital policy)
              setConsultationFee(association.consultationFee || 0);
            }
          }
        } catch (error) {
          console.error('Error loading hospital details:', error);
        }
      } else {
        setSelectedHospital(null);
        setSelectedHospitalDoctor(null);
        setIsShiftOngoing(false);
        // If self-employed or no hospital selected, use doctor's fee
        if (selectedDoctor && (isSelfEmployed || !formData.hospitalId)) {
          setConsultationFee(selectedDoctor.selfEmployedConsultationFee || 0);
        }
      }
    };
    loadHospitalDetails();
  }, [formData.hospitalId, formData.doctorId, selectedDoctor, isSelfEmployed]);

  // Fetch existing appointments for the selected doctor and date to check conflicts
  useEffect(() => {
    const fetchExistingAppointments = async () => {
      if (!formData.doctorId || !formData.appointmentDate) {
        setExistingAppointments([]);
        return;
      }

      try {
        const appointments = await appointmentsApi.getAppointments({
          doctorId: formData.doctorId,
          startDate: formData.appointmentDate,
          endDate: formData.appointmentDate,
        });
        setExistingAppointments(appointments);
      } catch (error) {
        console.error('Error fetching existing appointments:', error);
        setExistingAppointments([]);
      }
    };

    fetchExistingAppointments();
  }, [formData.doctorId, formData.appointmentDate]);

  // Periodically check if shift is ongoing (update every minute)
  useEffect(() => {
    if (!selectedHospitalDoctor || !selectedHospitalDoctor.startTime || !selectedHospitalDoctor.endTime) {
      return;
    }

    // Check immediately
    const shiftOngoing = checkIfShiftOngoing(selectedHospitalDoctor.startTime, selectedHospitalDoctor.endTime);
    setIsShiftOngoing(shiftOngoing);

    // Update every minute
    const interval = setInterval(() => {
      const ongoing = checkIfShiftOngoing(selectedHospitalDoctor.startTime, selectedHospitalDoctor.endTime);
      setIsShiftOngoing(ongoing);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedHospitalDoctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patientFullName.trim() || !formData.patientPhone.trim()) {
      setError('Please enter patient full name and phone number');
      return;
    }
    
    if ((bookingMethod === 'DOCTOR' && !formData.doctorId) || 
        (bookingMethod === 'HOSPITAL' && !formData.hospitalId) || 
        !formData.appointmentDate || !formData.appointmentTime) {
      setError('Please fill in all required fields');
      return;
    }

    // If Hospital mode and DIRECT_DOCTOR policy, doctor is required
    if (bookingMethod === 'HOSPITAL' && 
        selectedHospital?.bookingPolicy === 'DIRECT_DOCTOR' && 
        !formData.doctorId) {
      setError('This hospital requires selecting a doctor for appointments');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Find or create patient
      let patientId = formData.patientId;
      
      // First, try to find patient by phone (with normalized matching)
      if (!patientId) {
        console.log('🔍 [APPOINTMENT] Searching for existing patient by phone...');
        await searchPatientByPhone(formData.patientPhone.trim());
        patientId = formData.patientId;
      }
      
      if (!patientId) {
        // Patient not found, create new one
        console.log('🆕 [APPOINTMENT] Creating new patient...');
        
        // Parse full name into first and last name
        const nameParts = formData.patientFullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Generate username from full name
        const username = await generateUsernameFromFullName(formData.patientFullName);
        console.log('📝 [APPOINTMENT] Generated username for patient:', username);
        
        // Create new patient user
        const userData = {
          username: username,
          phone: formData.patientPhone.trim(),
          password: 'password', // Default password
          firstName: firstName,
          lastName: lastName,
          role: 'PATIENT' as const,
          userType: 'PATIENT' as const,
        };

        try {
          const newUser = await usersApi.createUser(userData);
          
          // Verify the user was created and has an ID
          if (!newUser || !newUser.id) {
            throw new Error('Patient was created but ID was not returned. Please try again.');
          }
          
          patientId = newUser.id;
          console.log('✅ [APPOINTMENT] New patient created:', {
            id: newUser.id,
            username: newUser.username,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
          });
          
          // Update form data with the new patient ID
          setFormData(prev => ({ ...prev, patientId: newUser.id }));
          setFoundPatient(newUser);
          
          // Verify the patient can be fetched before proceeding
          console.log('🔍 [APPOINTMENT] Verifying patient exists in database...');
          let verified = false;
          let verificationAttempts = 5;
          let verificationDelay = 500;
          
          while (!verified && verificationAttempts > 0) {
            try {
              const fetchedUser = await usersApi.getUserById(newUser.id);
              if (fetchedUser && fetchedUser.id === newUser.id) {
                verified = true;
                console.log('✅ [APPOINTMENT] Patient verified in database:', fetchedUser.id);
                break;
              }
            } catch (error) {
              console.log(`⏳ [APPOINTMENT] Patient not yet available, retrying in ${verificationDelay}ms... (${verificationAttempts - 1} attempts left)`);
              if (verificationAttempts > 1) {
                await new Promise(resolve => setTimeout(resolve, verificationDelay));
                verificationDelay = Math.min(verificationDelay * 1.5, 2000);
              }
            }
            verificationAttempts--;
          }
          
          if (!verified) {
            throw new Error('Patient was created but could not be verified. Please wait a moment and try again.');
          }
          
          // Additional wait to ensure cross-service availability
          console.log('⏳ [APPOINTMENT] Waiting for patient to be fully available across services...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Additional 1 second
        } catch (error: any) {
          console.error('❌ [APPOINTMENT] Error creating patient:', error);
          
          // If user creation fails due to conflict (phone already exists), try to find it
          if (error?.message?.includes('already exists') || error?.status === 409 || error?.statusCode === 409) {
            console.log('🔄 [APPOINTMENT] Patient creation failed due to conflict, searching again...');
            await searchPatientByPhone(formData.patientPhone.trim());
            patientId = formData.patientId;
            
            if (patientId) {
              console.log('✅ [APPOINTMENT] Found existing patient after conflict:', patientId);
            } else {
              // Try one more time with a delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              await searchPatientByPhone(formData.patientPhone.trim());
              patientId = formData.patientId;
              
              if (!patientId) {
                throw new Error('Patient with this phone already exists but could not be found. Please try again.');
              }
            }
          } else {
            throw error;
          }
        }
      } else {
        console.log('✅ [APPOINTMENT] Using existing patient:', patientId);
      }
      
      // Final validation: ensure we have a patient ID
      if (!patientId) {
        throw new Error('Failed to find or create patient. Please check the patient information and try again.');
      }

      console.log('📋 [APPOINTMENT] Patient ID confirmed:', patientId);
      console.log('📋 [APPOINTMENT] Proceeding to create appointment...');

      // Step 2: Create appointment
      // Note: consultationFee is calculated automatically by the backend based on hospital or self-employed
      // Format date as YYYY-MM-DD (extract date part only, not full ISO string)
      const appointmentDateStr = formData.appointmentDate.includes('T') 
        ? formData.appointmentDate.split('T')[0] 
        : formData.appointmentDate;
      
      const appointmentData: CreateAppointmentDto = {
        patientId: patientId,
        doctorId: formData.doctorId,
        hospitalId: formData.hospitalId || undefined,
        specialtyId: formData.specialtyId || undefined,
        appointmentDate: appointmentDateStr, // Send just YYYY-MM-DD format
        appointmentTime: formData.appointmentTime,
        duration: formData.duration,
        consultationType: formData.consultationType,
        reason: formData.reason || undefined,
        description: formData.description || undefined,
        createdBy: 'ADMIN',
      };

      await appointmentsApi.createAppointment(appointmentData);
      router.push('/admin/appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  // Generate smart time slots based on hospital shift or self-employed
  const generateTimeSlots = () => {
    let startHour = 8;
    let endHour = 20;
    let interval = 30; // minutes

    // If hospital is selected, use hospital shift times
    if (formData.hospitalId && selectedHospitalDoctor) {
      if (selectedHospitalDoctor.startTime && selectedHospitalDoctor.endTime) {
        const [startH, startM] = selectedHospitalDoctor.startTime.split(':').map(Number);
        const [endH, endM] = selectedHospitalDoctor.endTime.split(':').map(Number);
        startHour = startH;
        const startMinute = startM;
        endHour = endH;
        const endMinute = endM;

        // Generate slots within hospital shift
        const slots = [];
        let currentHour = startHour;
        let currentMinute = startMinute;

        while (
          currentHour < endHour ||
          (currentHour === endHour && currentMinute < endMinute)
        ) {
          const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
          
          // Check if this time slot conflicts with existing appointments
          const isConflict = existingAppointments.some(apt => {
            if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW' || apt.status === 'RESCHEDULED') {
              return false;
            }
            return apt.appointmentTime === timeString;
          });

          if (!isConflict) {
            slots.push(timeString);
          }

          // Move to next slot
          currentMinute += interval;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
          }
        }

        return slots;
      }
    } else if (bookingMethod === 'HOSPITAL' && !selectedHospitalDoctor) {
      // Hospital selected but no doctor assigned yet - use generic hours (e.g. 8-20)
      // In real app, we might use hospital global hours
      startHour = 8;
      endHour = 20;
    }

    // Self-employed or no hospital shift defined - use default times (8 AM to 8 PM)
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // Check if this time slot conflicts with existing appointments
        const isConflict = existingAppointments.some(apt => {
          if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW' || apt.status === 'RESCHEDULED') {
            return false;
          }
          return apt.appointmentTime === timeString;
        });

        if (!isConflict) {
          slots.push(timeString);
        }
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Appointment</h1>
          <p className="text-gray-600 mt-1">Schedule a new patient appointment</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.patientFullName}
                  onChange={(e) => setFormData({ ...formData, patientFullName: e.target.value })}
                  placeholder="Enter patient full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => {
                      const phone = e.target.value;
                      setFormData({ ...formData, patientPhone: phone });
                      
                      // Clear previous timeout
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                      
                      // Search for patient after a short delay (debounce)
                      if (phone.trim().length >= 3) {
                        searchTimeoutRef.current = setTimeout(() => {
                          searchPatientByPhone(phone);
                        }, 500);
                      } else {
                        setFoundPatient(null);
                        setFormData(prev => ({ ...prev, patientId: '' }));
                      }
                    }}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {searchingPatient && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {foundPatient && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="text-sm text-green-800">
                        <p><strong>Existing Patient Found:</strong> {foundPatient.firstName} {foundPatient.lastName}</p>
                        <p className="text-xs text-green-600">ID: {foundPatient.id}</p>
                      </div>
                    </div>
                  </div>
                )}
                {!foundPatient && formData.patientPhone.trim().length >= 3 && !searchingPatient && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">New patient will be created when appointment is submitted</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Method Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setBookingMethod('DOCTOR');
                setFormData(prev => ({ ...prev, hospitalId: '', doctorId: '' }));
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                bookingMethod === 'DOCTOR' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Book by Doctor
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingMethod('HOSPITAL');
                setFormData(prev => ({ ...prev, hospitalId: '', doctorId: '' }));
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                bookingMethod === 'HOSPITAL' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Book by Hospital
            </button>
          </div>

          {bookingMethod === 'DOCTOR' ? (
            <>
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={doctors}
                  value={formData.doctorId || ''}
                  onChange={(value) => setFormData({ ...formData, doctorId: value, hospitalId: '' })}
                  placeholder="Select a doctor"
                  loading={loadingDoctors}
                />
                {selectedDoctor && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <p><strong>Name:</strong> {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}</p>
                      <p><strong>License:</strong> {selectedDoctor.licenseNumber}</p>
                      <p><strong>Experience:</strong> {selectedDoctor.experience} years</p>
                      {selectedDoctor.specialties && selectedDoctor.specialties.length > 0 && (
                        <p><strong>Specialties:</strong> {selectedDoctor.specialties.map(s => s.name).join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hospital Selection - Only show if doctor has hospital associations */}
              {formData.doctorId && !isSelfEmployed && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital/Clinic {doctorHospitals.length > 0 ? '(Optional)' : ''}
                  </label>
                  {loadingDoctorHospitals ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Loading doctor's hospitals...</span>
                    </div>
                  ) : (
                    <>
                      <SearchableSelect
                        options={doctorHospitals}
                        value={formData.hospitalId}
                        onChange={(value) => setFormData({ ...formData, hospitalId: value })}
                        placeholder={doctorHospitals.length > 0 
                          ? "Select a hospital (optional - will use self-employed fee if not selected)"
                          : "No hospitals available"}
                        loading={false}
                      />
                      {selectedHospital && selectedHospitalDoctor && (
                        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="text-sm text-gray-700">
                            <p><strong>Hospital:</strong> {selectedHospital.name} ({selectedHospital.type})</p>
                            <p><strong>Address:</strong> {selectedHospital.address}, {selectedHospital.city}</p>
                            {selectedHospitalDoctor.shift && (
                              <p><strong>Shift:</strong> {selectedHospitalDoctor.shift}</p>
                            )}
                            {selectedHospitalDoctor.startTime && selectedHospitalDoctor.endTime && (
                              <p><strong>Working Hours:</strong> {selectedHospitalDoctor.startTime} - {selectedHospitalDoctor.endTime}</p>
                            )}
                            {isShiftOngoing && (
                              <p className="mt-1 text-green-700 font-medium">
                                ✓ Shift is currently ongoing
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Hospital Selection First */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={allHospitals}
                  value={formData.hospitalId}
                  onChange={async (value) => {
                    setFormData(prev => ({ ...prev, hospitalId: value, doctorId: '' }));
                    // Load hospital details to get booking policy
                    if (value) {
                      try {
                        const hospital = await hospitalApi.getHospitalById(value);
                        setSelectedHospital(hospital);
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                  placeholder="Select a hospital"
                  loading={loadingHospitals}
                />
              </div>

              {/* Display Booking Policy */}
              {selectedHospital && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <p><strong>Booking Policy:</strong> {selectedHospital.bookingPolicy === 'HOSPITAL_ASSIGNED' ? 'Hospital Assigns Doctor' : 'Direct Doctor Booking'}</p>
                    {selectedHospital.bookingPolicy === 'HOSPITAL_ASSIGNED' && (
                      <p className="text-xs mt-1">You can book an appointment now and the hospital will assign a doctor later.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Optional or Required Doctor Selection based on policy */}
              {formData.hospitalId && selectedHospital?.bookingPolicy === 'DIRECT_DOCTOR' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={filteredDoctors}
                    value={formData.doctorId || ''}
                    onChange={(value) => setFormData({ ...formData, doctorId: value })}
                    placeholder="Select a doctor"
                    loading={loadingDoctors}
                  />
                </div>
              )}
            </>
          )}
          
          {/* Self-Employed Notice */}
          {formData.doctorId && isSelfEmployed && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Self-Employed Doctor</p>
                  <p className="text-xs text-blue-700 mt-1">
                    This doctor is not associated with any hospitals. All appointments will use the doctor's self-employed consultation fee.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Time <span className="text-red-500">*</span>
                {formData.hospitalId && selectedHospitalDoctor && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Hospital Shift: {selectedHospitalDoctor.startTime || 'N/A'} - {selectedHospitalDoctor.endTime || 'N/A'})
                  </span>
                )}
                {!formData.hospitalId && (
                  <span className="ml-2 text-xs text-gray-500">(Self-employed: 8:00 AM - 8:00 PM)</span>
                )}
                {bookingMethod === 'HOSPITAL' && !selectedHospitalDoctor && (
                   <span className="ml-2 text-xs text-gray-500">(General Hospital Hours)</span>
                )}
              </label>
              {timeSlots.length === 0 ? (
                <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50">
                  <p className="text-sm text-red-700">
                    {formData.hospitalId 
                      ? 'No available time slots for this hospital shift on the selected date. Please select a different date or hospital.'
                      : 'No available time slots on the selected date. Please select a different date.'}
                  </p>
                </div>
              ) : (
                <select
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.map(time => {
                    const isConflict = existingAppointments.some(apt => 
                      apt.appointmentTime === time && 
                      apt.status !== 'CANCELLED' && 
                      apt.status !== 'NO_SHOW' && 
                      apt.status !== 'RESCHEDULED'
                    );
                    return (
                      <option 
                        key={time} 
                        value={time}
                        disabled={isConflict}
                      >
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                        {isConflict ? ' (Booked)' : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Duration and Consultation Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                min={15}
                max={240}
                step={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, consultationType: 'IN_PERSON' })}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center space-y-1 ${
                    formData.consultationType === 'IN_PERSON'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="text-xs">In Person</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, consultationType: 'VIDEO' })}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center space-y-1 ${
                    formData.consultationType === 'VIDEO'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span className="text-xs">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, consultationType: 'PHONE' })}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center space-y-1 ${
                    formData.consultationType === 'PHONE'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-xs">Phone</span>
                </button>
              </div>
            </div>
          </div>

          {/* Consultation Fee Display */}
          {consultationFee > 0 && (
            <div className={`p-4 border rounded-lg ${
              isSelfEmployed 
                ? 'bg-blue-50 border-blue-200' 
                : isShiftOngoing 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                <DollarSign className={`w-5 h-5 ${
                  isSelfEmployed 
                    ? 'text-blue-600' 
                    : isShiftOngoing 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isSelfEmployed 
                      ? 'text-blue-800' 
                      : isShiftOngoing 
                        ? 'text-green-800' 
                        : 'text-yellow-800'
                  }`}>
                    {isSelfEmployed
                      ? 'Self-Employed Consultation Fee'
                      : 'Hospital Consultation Fee'}
                  </p>
                  <p className={`text-lg font-bold ${
                    isSelfEmployed 
                      ? 'text-blue-900' 
                      : isShiftOngoing 
                        ? 'text-green-900' 
                        : 'text-yellow-900'
                  }`}>
                    ${(consultationFee / 100).toFixed(2)}
                  </p>
                  {isSelfEmployed ? (
                    <p className={`text-xs mt-1 ${
                      isSelfEmployed ? 'text-blue-700' : 'text-yellow-700'
                    }`}>
                      Doctor is self-employed (no hospital associations)
                    </p>
                  ) : formData.hospitalId && selectedHospitalDoctor ? (
                    <div className="mt-1 space-y-1">
                      <p className={`text-xs ${
                        isShiftOngoing ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        Based on hospital association with {selectedHospital?.name}
                      </p>
                      {selectedHospitalDoctor.startTime && selectedHospitalDoctor.endTime && (
                        <p className={`text-xs ${
                          isShiftOngoing ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          Shift: {selectedHospitalDoctor.startTime} - {selectedHospitalDoctor.endTime}
                          {isShiftOngoing ? ' (Currently Ongoing)' : ' (Not Currently Active)'}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Reason and Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., General checkup, Follow-up, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Any additional information about the appointment..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Create Appointment</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

