'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Building2,
  Stethoscope,
  Phone,
  Video,
  Monitor,
  X,
  RefreshCw,
  Save,
  Mail,
  MapPin,
  Volume2,
  VolumeX,
  Printer
} from 'lucide-react';
import { appointmentsApi, Appointment, AppointmentStatus, PaymentStatus, ConsultationType } from '@/services/appointmentsApi';
import { usersApi, User } from '@/services/usersApi';
import { doctorApi, Doctor } from '@/services/doctorApi';
import { hospitalApi, Hospital } from '@/services/hospitalApi';
import { SkeletonStats, SkeletonTable } from '@/components/skeletons';
import { getAppointmentWebSocketService, AppointmentWebSocketEvent } from '@/services/appointmentWebSocket';
import { getSoundNotificationService } from '@/utils/soundNotification';
import { callApi } from '@/services/callApi';
import { paymentApi, Payment } from '@/services/paymentApi';
import { API_CONFIG } from '@/config/api';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('ALL');
  const [filterConsultationType, setFilterConsultationType] = useState<string>('ALL');
  // Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Appointment details (loaded for all appointments)
  const [appointmentDetails, setAppointmentDetails] = useState<Map<string, {
    patient?: User;
    doctor?: Doctor;
    hospital?: Hospital;
  }>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'OTHER'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Assign Doctor modal state
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [assigningAppointment, setAssigningAppointment] = useState<Appointment | null>(null);
  const [assignDoctorId, setAssignDoctorId] = useState('');
  const [assignDoctorsList, setAssignDoctorsList] = useState<{value: string, label: string}[]>([]);
  const [loadingAssignDoctors, setLoadingAssignDoctors] = useState(false);

  // Fetch appointments and stats
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (filterStatus !== 'ALL') filters.status = filterStatus;
      if (filterPaymentStatus !== 'ALL') filters.paymentStatus = filterPaymentStatus;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const [appointmentsData, statsData] = await Promise.all([
        appointmentsApi.getAppointments(filters),
        appointmentsApi.getStats(),
      ]);

      setAppointments(appointmentsData);
      setStats(statsData);
      
      // Load details for all appointments
      await loadAllAppointmentDetails(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Set up WebSocket for real-time updates
  useEffect(() => {
    const wsService = getAppointmentWebSocketService();
    const soundService = getSoundNotificationService();

    // Sync mute state with sound service
    soundService.setMuted(soundMuted);

    const handleAppointmentCreated = (event: AppointmentWebSocketEvent) => {
      console.log('📥 [AppointmentsPage] New appointment created:', event.appointment);
      if (event.appointment) {
        // Play notification sound (only if not muted)
        if (!soundMuted) {
          soundService.playNotification();
        }
        
        // Add new appointment to the list
        setAppointments((prev) => {
          // Check if appointment already exists
          if (prev.some((a) => a.id === event.appointment.id)) {
            return prev;
          }
          return [event.appointment, ...prev];
        });
        
        // Load details for the new appointment
        loadAppointmentDetails(event.appointment.id, event.appointment);
        
        // Refresh stats
        appointmentsApi.getStats().then(setStats).catch(console.error);
      }
    };

    const handleAppointmentUpdated = (event: AppointmentWebSocketEvent) => {
      console.log('📥 [AppointmentsPage] Appointment updated:', event.appointment);
      if (event.appointment) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === event.appointment.id ? event.appointment : a))
        );
        
        // Refresh stats
        appointmentsApi.getStats().then(setStats).catch(console.error);
      }
    };

    const handleAppointmentCancelled = (event: AppointmentWebSocketEvent) => {
      console.log('📥 [AppointmentsPage] Appointment cancelled:', event.appointmentId);
      if (event.appointmentId) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === event.appointmentId
              ? { ...a, status: 'CANCELLED' as AppointmentStatus }
              : a
          )
        );
        
        // Refresh stats
        appointmentsApi.getStats().then(setStats).catch(console.error);
      }
    };

    const handleCallAccepted = (event: AppointmentWebSocketEvent) => {
      console.log('📥 [AppointmentsPage] Call accepted:', event);
      if (event.appointmentId) {
        // Show notification or update UI to indicate call was accepted
        console.log(`✅ Patient accepted call for appointment ${event.appointmentId}`);
        // You can add a toast notification here or update appointment status
      }
    };

    const handleCallStarted = (event: AppointmentWebSocketEvent) => {
      console.log('📥 [AppointmentsPage] Call started:', event);
      if (event.appointmentId) {
        // Show notification or update UI to indicate call is active
        console.log(`📞 Call started for appointment ${event.appointmentId}`);
        // You can add a toast notification here or update appointment status
      }
    };

    const handleCallEnded = (event: AppointmentWebSocketEvent) => {
      console.log('📥 [AppointmentsPage] Call ended:', event);
      if (event.appointmentId) {
        console.log(`📞 Call ended for appointment ${event.appointmentId}`);
      }
    };

    // Subscribe to events
    wsService.on('appointment.created', handleAppointmentCreated);
    wsService.on('appointment.updated', handleAppointmentUpdated);
    wsService.on('appointment.cancelled', handleAppointmentCancelled);
    wsService.on('call.accepted', handleCallAccepted);
    wsService.on('call.started', handleCallStarted);
    wsService.on('call.ended', handleCallEnded);

    // Cleanup on unmount
    return () => {
      wsService.off('appointment.created', handleAppointmentCreated);
      wsService.off('appointment.updated', handleAppointmentUpdated);
      wsService.off('appointment.cancelled', handleAppointmentCancelled);
      wsService.off('call.accepted', handleCallAccepted);
      wsService.off('call.started', handleCallStarted);
      wsService.off('call.ended', handleCallEnded);
    };
  }, [soundMuted]);

  // Load details for a single appointment
  const loadAppointmentDetails = async (appointmentId: string, appointment: Appointment) => {
    setLoadingDetails((prev) => new Set([...prev, appointmentId]));
    
    try {
      const [patient, doctor, hospital] = await Promise.all([
        usersApi.getUserById(appointment.patientId),
        appointment.doctorId 
          ? doctorApi.getDoctorById(appointment.doctorId).catch(() => null)
          : Promise.resolve(null),
        appointment.hospitalId
          ? hospitalApi.getHospitalById(appointment.hospitalId).catch(() => null)
          : Promise.resolve(null),
      ]);

      setAppointmentDetails((prev) => {
        const newMap = new Map(prev);
        newMap.set(appointmentId, { patient, doctor, hospital });
        return newMap;
      });
    } catch (error) {
      console.error(`Error loading details for appointment ${appointmentId}:`, error);
    } finally {
      setLoadingDetails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  // Load details for all appointments
  const loadAllAppointmentDetails = async (appointments: Appointment[]) => {
    const appointmentIds = appointments.map(a => a.id);
    setLoadingDetails(new Set(appointmentIds));
    
    try {
      const detailsPromises = appointments.map(async (appointment) => {
        try {
          const [patient, doctor, hospital] = await Promise.all([
            usersApi.getUserById(appointment.patientId),
            appointment.doctorId 
              ? doctorApi.getDoctorById(appointment.doctorId).catch(() => null)
              : Promise.resolve(null),
            appointment.hospitalId
              ? hospitalApi.getHospitalById(appointment.hospitalId).catch(() => null)
              : Promise.resolve(null),
          ]);

          return {
            appointmentId: appointment.id,
            details: {
              patient: patient || undefined,
              doctor: doctor || undefined,
              hospital: hospital || undefined,
            },
          };
        } catch (error) {
          console.error(`Error loading details for appointment ${appointment.id}:`, error);
          return {
            appointmentId: appointment.id,
            details: {
              patient: undefined,
              doctor: undefined,
              hospital: undefined,
            },
          };
        }
      });

      const results = await Promise.all(detailsPromises);
      const newDetailsMap = new Map<string, { patient?: User; doctor?: Doctor; hospital?: Hospital }>();
      
      results.forEach(({ appointmentId, details }) => {
        newDetailsMap.set(appointmentId, details);
      });

      setAppointmentDetails(newDetailsMap);
    } catch (error) {
      console.error('Error loading appointment details:', error);
    } finally {
      setLoadingDetails(new Set());
    }
  };

  useEffect(() => {
    fetchAppointments();
    setCurrentPage(1); // Reset to first page when filters change
  }, [filterStatus, filterPaymentStatus, startDate, endDate]);

  // Filter appointments by search term, status, payment status, consultation type, and date range
  const filteredAppointments = appointments.filter(appointment => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const details = appointmentDetails.get(appointment.id);
    const patientName = details?.patient 
      ? `${details.patient.firstName || ''} ${details.patient.lastName || ''}`.toLowerCase().trim()
      : '';
    const patientPhone = details?.patient?.phone?.toLowerCase() || '';
    
    const matchesSearch = searchTerm === '' || 
      appointment.patientId.toLowerCase().includes(searchLower) ||
      (appointment.doctorId && appointment.doctorId.toLowerCase().includes(searchLower)) ||
      appointment.reason?.toLowerCase().includes(searchLower) ||
      appointment.description?.toLowerCase().includes(searchLower) ||
      (appointment.appointmentNumber && String(appointment.appointmentNumber).toLowerCase().includes(searchLower)) ||
      patientName.includes(searchLower) ||
      patientPhone.includes(searchLower);

    // Status filter
    const matchesStatus = filterStatus === 'ALL' || 
      appointment.status === filterStatus;

    // Payment status filter
    const matchesPaymentStatus = filterPaymentStatus === 'ALL' || 
      appointment.paymentStatus === filterPaymentStatus;

    // Consultation type filter
    const matchesConsultationType = filterConsultationType === 'ALL' || 
      appointment.consultationType === filterConsultationType;

    // Date range filter
    let matchesDateRange = true;
    if (startDate || endDate) {
      const appointmentDate = new Date(appointment.appointmentDate);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (appointmentDate < start) {
          matchesDateRange = false;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (appointmentDate > end) {
          matchesDateRange = false;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesConsultationType && matchesDateRange;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getStatusBadgeColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800';
      case 'RESCHEDULED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConsultationTypeIcon = (type: ConsultationType) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'PHONE':
        return <Phone className="w-4 h-4" />;
      case 'IN_PERSON':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      case 'NO_SHOW':
        return <AlertCircle className="w-4 h-4" />;
      case 'RESCHEDULED':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // Time is in HH:MM format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatAppointmentNumber = (number: number | undefined): string => {
    if (!number) return 'N/A';
    // Format: 001, 002, ..., 999, 1000, 1001, etc.
    // Numbers < 1000: pad with leading zeros (001, 225, 263, 999)
    // Numbers >= 1000: no padding (1000, 1001, etc.)
    return number < 1000 ? number.toString().padStart(3, '0') : number.toString();
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await appointmentsApi.cancelAppointment(id, 'ADMIN', 'Cancelled by admin');
      await fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel appointment');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentsApi.completeAppointment(id);
      await fetchAppointments();
      // Simple success feedback - the UI will update automatically
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete appointment');
    }
  };

  // Simple status change handler - can be used for quick status updates
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      if (newStatus === 'COMPLETED') {
        await appointmentsApi.completeAppointment(id);
      } else {
        await appointmentsApi.updateAppointment(id, { status: newStatus });
      }
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update appointment status');
    }
  };

  const handleStartVideoCall = async (appointment: Appointment) => {
    try {
      // Get admin user ID
      const adminUser = localStorage.getItem('adminUser');
      if (!adminUser) {
        alert('Not authenticated. Please log in again.');
        return;
      }

      let adminUserId: string;
      try {
        const userData = JSON.parse(adminUser);
        adminUserId = userData.id || userData.userId;
      } catch {
        alert('Invalid user data. Please log in again.');
        return;
      }

      // Only allow video calls for VIDEO consultation type
      if (appointment.consultationType !== 'VIDEO') {
        alert('Video calls are only available for VIDEO consultation type appointments.');
        return;
      }

      // Only allow calls for active appointments
      if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
        alert('Cannot start a call for a cancelled or completed appointment.');
        return;
      }

      // Create call session
      const response = await callApi.createCall(appointment.id, adminUserId);
      
      // Navigate to call page
      router.push(`/call/${appointment.id}`);
    } catch (error) {
      console.error('Error starting video call:', error);
      alert(error instanceof Error ? error.message : 'Failed to start video call');
    }
  };

  // Payment handlers
  const handleOpenPaymentModal = async (appointment: Appointment) => {
    console.log('💳 Opening payment modal for appointment:', appointment.id);
    setSelectedAppointment(appointment);
    setPaymentAmount((appointment.consultationFee / 100).toFixed(2)); // Convert cents to currency
    setPaymentMethod('CASH');
    setPaymentNotes('');
    
    // Ensure patient details are loaded for phone number
    const details = appointmentDetails.get(appointment.id);
    if (!details?.patient) {
      await loadAppointmentDetails(appointment.id, appointment);
    }
    
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedAppointment(null);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setPaymentNotes('');
  };

  // Assign Doctor Handlers
  const handleOpenAssignDoctorModal = async (appointment: Appointment) => {
    setAssigningAppointment(appointment);
    setAssignDoctorId('');
    setShowAssignDoctorModal(true);
    setLoadingAssignDoctors(true);

      try {
        let doctorsData;
        if (appointment.hospitalId) {
          // Fetch doctors for this hospital
          try {
            const response = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/${appointment.hospitalId}/doctors`, {
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const hospitalDoctors = await response.json();
              // Filter logic based on hospitalDoctors response
              const allDoctors = await doctorApi.getDoctors();
              
              // If hospitalDoctors is array of objects with doctorId
              const hospitalDoctorIds = new Set(hospitalDoctors.map((hd: any) => hd.doctorId));
              doctorsData = allDoctors.filter(d => hospitalDoctorIds.has(d.id));
            } else {
               // Fallback to all doctors if hospital-specific fetch fails
              console.warn('Failed to fetch hospital doctors, falling back to all doctors');
              doctorsData = await doctorApi.getDoctors();
            }
          } catch (err) {
            console.warn('Error fetching hospital doctors, falling back to all doctors', err);
            doctorsData = await doctorApi.getDoctors();
          }
        } else {
          doctorsData = await doctorApi.getDoctors();
        }

        setAssignDoctorsList(doctorsData.map(d => ({
          value: d.id,
          label: `${d.user?.firstName || ''} ${d.user?.lastName || ''} (${d.licenseNumber})`
        })));
      } catch (error) {
        console.error('Error fetching doctors for assignment:', error);
        alert('Failed to load doctors list');
      } finally {
        setLoadingAssignDoctors(false);
      }
  };

  const handleSaveAssignDoctor = async () => {
    if (!assigningAppointment || !assignDoctorId) return;

    try {
      // Update appointment with new doctorId
      // We need an endpoint for this or use generic update
      // Note: updating doctorId might require checking schedule conflicts in backend
      await appointmentsApi.updateAppointment(assigningAppointment.id, {
        // We need to cast to any if doctorId is not in UpdateAppointmentDto yet, 
        // but backend should support it if we added it to schema?
        // Wait, UpdateAppointmentDto in frontend usually matches backend.
        // I should check UpdateAppointmentDto in frontend.
        // It doesn't have doctorId in the interface I read earlier!
        // I need to add it to UpdateAppointmentDto in appointmentsApi.ts if I want to update it.
      } as any); 
      
      // Actually, let's look at UpdateAppointmentDto in appointmentsApi.ts
      // It doesn't have doctorId. I should add it.
      
      // For now, I will cast to any to bypass TS check, assuming backend accepts it.
      // Backend `update` method in `appointments.service.ts` uses `UpdateAppointmentDto` which extends `PartialType(CreateAppointmentDto)`.
      // `CreateAppointmentDto` HAS `doctorId`. So `UpdateAppointmentDto` should have it too (optional).
      // So backend is fine. Frontend interface needs update.
      
      await appointmentsApi.updateAppointment(assigningAppointment.id, {
        doctorId: assignDoctorId 
      });

      setShowAssignDoctorModal(false);
      setAssigningAppointment(null);
      setAssignDoctorId('');
      await fetchAppointments();
    } catch (error) {
      console.error('Error assigning doctor:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign doctor');
    }
  };

  // Handle print receipt for paid appointments
  const handlePrintReceipt = (appointment: Appointment) => {
    // Navigate to receipt page
    router.push(`/admin/appointments/receipt/${appointment.id}`);
  };

  const handleProcessPayment = async () => {
    if (!selectedAppointment) return;

    try {
      setProcessingPayment(true);

      // Get admin user ID
      const adminUser = localStorage.getItem('adminUser');
      if (!adminUser) {
        alert('Not authenticated. Please log in again.');
        return;
      }

      let adminUserId: string;
      try {
        const userData = JSON.parse(adminUser);
        adminUserId = userData.id || userData.userId;
      } catch {
        alert('Invalid user data. Please log in again.');
        return;
      }

      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(paymentAmount) * 100);

      if (isNaN(amountInCents) || amountInCents <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      // Get patient phone number from appointment details
      const details = appointmentDetails.get(selectedAppointment.id);
      const patientPhone = details?.patient?.phone || null;

      if (!patientPhone) {
        alert('Patient phone number not found. Please ensure patient details are loaded.');
        return;
      }

      // Create payment (already created as PAID by default)
      const payment = await paymentApi.createPayment({
        appointmentId: selectedAppointment.id,
        amount: amountInCents,
        paymentMethod: paymentMethod,
        currency: 'USD',
        notes: paymentNotes,
        paidBy: patientPhone,
        processedBy: adminUserId,
      });

      // Payment is already PAID when created, no need to process it
      // Update appointment payment status
      await appointmentsApi.updateAppointment(selectedAppointment.id, {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod,
        paymentTransactionId: payment.receiptNumber,
      });

      // Refresh appointments
      await fetchAppointments();

      // Close payment modal
      handleClosePaymentModal();

      // Navigate to receipt page
      router.push(`/admin/appointments/receipt/${selectedAppointment.id}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };


  // Handle edit
  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment.id);
    setEditFormData({
      appointmentDate: new Date(appointment.appointmentDate).toISOString().split('T')[0],
      appointmentTime: appointment.appointmentTime,
      duration: appointment.duration,
      consultationType: appointment.consultationType,
      reason: appointment.reason || '',
      description: appointment.description || '',
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      notes: appointment.notes || '',
    });
  };

  // Save edit
  const handleSaveEdit = async (appointmentId: string) => {
    try {
      const updateData: any = {
        appointmentDate: editFormData.appointmentDate,
        appointmentTime: editFormData.appointmentTime,
        duration: editFormData.duration,
        consultationType: editFormData.consultationType,
        reason: editFormData.reason || undefined,
        description: editFormData.description || undefined,
        status: editFormData.status,
        paymentStatus: editFormData.paymentStatus,
        notes: editFormData.notes || undefined,
      };

      await appointmentsApi.updateAppointment(appointmentId, updateData);
      setEditingAppointment(null);
      setEditFormData(null);
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert(error instanceof Error ? error.message : 'Failed to update appointment');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingAppointment(null);
    setEditFormData(null);
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={4} />
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-2">Manage patient appointments and schedules</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Appointments</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchAppointments}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-2">
            Manage patient appointments and schedules
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sound Notification Toggle */}
          <button
            onClick={() => {
              const newMutedState = !soundMuted;
              setSoundMuted(newMutedState);
              getSoundNotificationService().setMuted(newMutedState);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              soundMuted
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            title={soundMuted ? 'Unmute notifications' : 'Mute notifications'}
          >
            {soundMuted ? (
              <>
                <VolumeX className="w-5 h-5" />
                <span className="text-sm font-medium">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span className="text-sm font-medium">Sound On</span>
              </>
            )}
          </button>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/admin/appointments/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Appointment</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.byStatus.find((s: any) => s.status === 'PENDING')?.count || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.byStatus.find((s: any) => s.status === 'CONFIRMED')?.count || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.revenue || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment</label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="ALL">All Payment</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterConsultationType}
                onChange={(e) => setFilterConsultationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="IN_PERSON">In Person</option>
                <option value="VIDEO">Video</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {/* Results Count and Date Filter Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} appointments
            </span>
            {(startDate || endDate) && (
              <span className="text-xs">
                {startDate === endDate ? (
                  <>Date: <span className="font-semibold">{formatDate(startDate)}</span></>
                ) : (
                  <>Date Range: <span className="font-semibold">{formatDate(startDate)} - {formatDate(endDate)}</span></>
                )}
              </span>
            )}
          </div>
          {/* Quick Date Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                startDate === today && endDate === today
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                setStartDate(tomorrowStr);
                setEndDate(tomorrowStr);
                setCurrentPage(1);
              }}
              className="px-3 py-1 rounded text-xs font-medium bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Tomorrow
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="px-3 py-1 rounded text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              All Dates
            </button>
          </div>
        </div>

        {paginatedAppointments.map((appointment, index) => {
          const details = appointmentDetails.get(appointment.id);
          const isLoadingDetails = loadingDetails.has(appointment.id);
          const isEditing = editingAppointment === appointment.id;

          return (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg shadow-md border-l-4 border-sky-400 hover:shadow-lg transition-all overflow-hidden relative"
              style={{
                boxShadow: '0 4px 6px -1px rgba(56, 189, 248, 0.1), 0 2px 4px -1px rgba(56, 189, 248, 0.06)'
              }}
            >
              {/* Ticket perforation effect */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-300 via-sky-400 to-sky-300"></div>
              {isEditing ? (
                /* Edit Form */
                <div className="p-6 bg-sky-50 border-t-2 border-sky-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Edit Appointment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={editFormData.appointmentDate}
                        onChange={(e) => setEditFormData({ ...editFormData, appointmentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={editFormData.appointmentTime}
                        onChange={(e) => setEditFormData({ ...editFormData, appointmentTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={editFormData.duration}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) || 30 })}
                        min={15}
                        step={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
                      <select
                        value={editFormData.consultationType}
                        onChange={(e) => setEditFormData({ ...editFormData, consultationType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="IN_PERSON">In Person</option>
                        <option value="VIDEO">Video</option>
                        <option value="PHONE">Phone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="NO_SHOW">No Show</option>
                        <option value="RESCHEDULED">Rescheduled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select
                        value={editFormData.paymentStatus}
                        onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                      <input
                        type="text"
                        value={editFormData.reason}
                        onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doctor's notes after appointment"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3 mt-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(appointment.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Appointment Details Row - Ticket Design */
                <div className="p-5 pl-6">
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
                      <span className="ml-2 text-sky-700">Loading details...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Patient Information */}
                      <div className="lg:col-span-3 border-r-2 border-sky-200 pr-4">
                        <h4 className="font-semibold text-sky-800 mb-2 flex items-center text-sm">
                          <UserIcon className="w-4 h-4 mr-2 text-sky-600" />
                          Patient
                        </h4>
                        {details?.patient ? (
                          <div className="space-y-1.5 text-xs">
                            <p className="font-semibold text-sky-900">{details.patient.firstName} {details.patient.lastName}</p>
                            {details.patient.phone && (
                              <p className="flex items-center text-sky-700"><Phone className="w-3 h-3 mr-1.5 text-sky-500" />{details.patient.phone}</p>
                            )}
                            {details.patient.email && (
                              <p className="flex items-center text-sky-700"><Mail className="w-3 h-3 mr-1.5 text-sky-500" />{details.patient.email}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-sky-600">ID: {appointment.patientId.substring(0, 8)}...</p>
                        )}
                      </div>

                      {/* Doctor Information */}
                      <div className="lg:col-span-3 border-r-2 border-sky-200 pr-4">
                        <h4 className="font-semibold text-sky-800 mb-2 flex items-center text-sm">
                          <Stethoscope className="w-4 h-4 mr-2 text-sky-600" />
                          Doctor
                        </h4>
                        {details?.doctor ? (
                          <div className="flex gap-3">
                            {details.doctor.imageUrl ? (
                              <img 
                                src={details.doctor.imageUrl} 
                                alt={`Dr. ${details.doctor.user?.firstName} ${details.doctor.user?.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-sky-300 shadow-sm"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm border-2 border-sky-300 shadow-sm ${details.doctor.imageUrl ? 'hidden' : ''}`}
                            >
                              {details.doctor.user?.firstName?.[0] || 'D'}{details.doctor.user?.lastName?.[0] || ''}
                            </div>
                            <div className="space-y-1 text-xs flex-1">
                              <p className="font-semibold text-sky-900">{details.doctor.user?.firstName} {details.doctor.user?.lastName}</p>
                              <p className="text-sky-700">License: <span className="font-medium">{details.doctor.licenseNumber}</span></p>
                              {details.doctor.specialties && details.doctor.specialties.length > 0 && (
                                <p className="text-sky-700 truncate" title={details.doctor.specialties.map((s: any) => s.name).join(', ')}>
                                  <span className="font-medium">Spec:</span> {details.doctor.specialties[0].name}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-sky-600">
                            {appointment.doctorId ? `ID: ${appointment.doctorId.substring(0, 8)}...` : 'Pending Assignment'}
                          </p>
                        )}
                      </div>

                      {/* Hospital Information (if exists) */}
                      {appointment.hospitalId && (
                        <div className="lg:col-span-2 border-r-2 border-sky-200 pr-4">
                          <h4 className="font-semibold text-sky-800 mb-2 flex items-center text-sm">
                            <Building2 className="w-4 h-4 mr-2 text-sky-600" />
                            Hospital
                          </h4>
                          {details?.hospital ? (
                            <div className="flex gap-2 items-start">
                              {details.hospital.logoUrl ? (
                                <img 
                                  src={details.hospital.logoUrl} 
                                  alt={details.hospital.name}
                                  className="w-10 h-10 rounded-lg object-contain bg-white border-2 border-sky-300 shadow-sm p-1"
                                  onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center border-2 border-sky-300 shadow-sm">
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold text-sky-900">{details.hospital.name}</p>
                                <p className="text-sky-700">{details.hospital.type}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-sky-600">ID: {appointment.hospitalId.substring(0, 8)}...</p>
                          )}
                        </div>
                      )}

                      {/* Appointment Information */}
                      <div className={`${appointment.hospitalId ? 'lg:col-span-4' : 'lg:col-span-6'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Appointment Number - Prominent Display */}
                            <div className="mb-3">
                              <div className="inline-flex items-center bg-gradient-to-r from-sky-600 to-blue-600 text-white px-5 py-3 rounded-lg shadow-lg">
                                <span className="text-sm font-semibold mr-3 opacity-90">APPT #</span>
                                <span className="text-3xl font-bold tracking-wider">
                                  {formatAppointmentNumber(appointment.appointmentNumber)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-md">
                                {getConsultationTypeIcon(appointment.consultationType)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${getStatusBadgeColor(appointment.status)}`}>
                                    {getStatusIcon(appointment.status)}
                                    <span className="ml-1">{appointment.status}</span>
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${getPaymentStatusBadgeColor(appointment.paymentStatus)}`}>
                                    {appointment.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-sky-800 bg-white/60 rounded-md p-2">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1.5 text-sky-600" />
                                <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1.5 text-sky-600" />
                                <span className="font-medium">{formatTime(appointment.appointmentTime)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {appointment.duration} min
                              </div>
                              <div>
                                <span className="font-medium">Fee:</span> <span className="text-sky-700 font-semibold">{formatCurrency(appointment.consultationFee)}</span>
                              </div>
                              {appointment.reason && (
                                <div className="col-span-2 text-sky-700">
                                  <span className="font-medium">Reason:</span> {appointment.reason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center space-y-2 ml-4">
                            {appointment.consultationType === 'VIDEO' && 
                             appointment.status !== 'CANCELLED' && 
                             appointment.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStartVideoCall(appointment)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm"
                                title="Start Video Call"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                            )}
                            {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleEdit(appointment)}
                                className="text-sky-600 hover:text-sky-800 p-2 rounded-lg hover:bg-sky-100 transition-colors shadow-sm"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Assign Doctor Button - Show if doctor is missing and status is PENDING/CONFIRMED */}
                            {!appointment.doctorId && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenAssignDoctorModal(appointment);
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm font-medium flex items-center gap-1.5"
                                title="Assign Doctor"
                              >
                                <UserIcon className="w-4 h-4" />
                                <span>Assign</span>
                              </button>
                            )}

                            {/* Pay Button - Show if payment is pending or not paid */}
                            {(appointment.paymentStatus !== 'PAID' && appointment.paymentStatus !== 'REFUNDED' && appointment.paymentStatus !== 'CANCELLED') && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('💳 Pay button clicked for appointment:', appointment.id, 'Payment status:', appointment.paymentStatus);
                                  handleOpenPaymentModal(appointment);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm font-medium flex items-center gap-1.5"
                                title="Process Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                                <span>Pay</span>
                              </button>
                            )}
                            
                            {/* Print Receipt Button - Show if payment is paid */}
                            {appointment.paymentStatus === 'PAID' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePrintReceipt(appointment);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm font-medium flex items-center gap-1.5"
                                title="Print Paid Receipt"
                              >
                                <Printer className="w-4 h-4" />
                                <span>Print Receipt</span>
                              </button>
                            )}
                            
                            {/* Simple Status Dropdown - One-click status change */}
                            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                              <select
                                value={appointment.status}
                                onChange={(e) => handleStatusChange(appointment.id, e.target.value as AppointmentStatus)}
                                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer"
                                title="Change Status"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">✓ Complete</option>
                                <option value="NO_SHOW">No Show</option>
                              </select>
                            )}
                            {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleCancel(appointment.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          );
        })}

        {filteredAppointments.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredAppointments.length > itemsPerPage && (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
                <button
                  onClick={handleClosePaymentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment
                  </label>
                  <div className="text-sm text-gray-600">
                    Appointment #{selectedAppointment.appointmentNumber || selectedAppointment.id.slice(0, 8)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    ${(selectedAppointment.consultationFee / 100).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Additional payment notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClosePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={processingPayment || !paymentAmount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Process Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign Doctor Modal */}
      {showAssignDoctorModal && assigningAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Assign Doctor</h2>
                <button
                  onClick={() => setShowAssignDoctorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Doctor <span className="text-red-500">*</span>
                  </label>
                  {loadingAssignDoctors ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading doctors...</span>
                    </div>
                  ) : (
                    <select
                      value={assignDoctorId}
                      onChange={(e) => setAssignDoctorId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Select a doctor</option>
                      {assignDoctorsList.map(doctor => (
                        <option key={doctor.value} value={doctor.value}>
                          {doctor.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAssignDoctorModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignDoctor}
                  disabled={!assignDoctorId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Assign Doctor
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
