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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
        newMap.set(appointmentId, { 
          patient: patient || undefined, 
          doctor: doctor || undefined, 
          hospital: hospital || undefined 
        });
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
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <span className="self-center text-gray-400">-</span>
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {/* Results Count, Date Filter, and Per Page Selection */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Results Count and Date Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-sm text-gray-700 font-medium">
                Showing <span className="text-gray-900 font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)}</span> of <span className="text-gray-900 font-semibold">{filteredAppointments.length}</span> appointments
              </span>
              {(startDate || endDate) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    {startDate === endDate ? (
                      formatDate(startDate)
                    ) : (
                      <>{formatDate(startDate)} - {formatDate(endDate)}</>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            {/* Right: Per Page Selection and Quick Date Filters */}
            <div className="flex items-center gap-3">
              {/* Per Page Selection */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              {/* Quick Date Filters - Better Design */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    setEndDate(today);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    startDate === today && endDate === today
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    (() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const tomorrowStr = tomorrow.toISOString().split('T')[0];
                      return startDate === tomorrowStr && endDate === tomorrowStr;
                    })()
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !startDate && !endDate
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  All Dates
                </button>
              </div>
            </div>
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
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden relative"
              style={{
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Airline Ticket Top Border */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"></div>
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
                /* Professional Airline Ticket Style Appointment Card */
                <div className="relative bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all overflow-hidden">
                  {/* Top Gradient Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                  
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-16">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <span className="ml-3 text-gray-700 font-medium">Loading appointment details...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Side - Doctor Portrait Section */}
                      <div className="lg:w-56 flex-shrink-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex flex-col items-center justify-center border-r-2 border-dashed border-gray-300 relative">
                        {/* Perforated Edge Effect */}
                        <div className="absolute right-0 top-0 bottom-0 w-3 flex flex-col justify-center gap-1.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="w-1.5 h-4 bg-gray-300 rounded-full"></div>
                          ))}
                        </div>
                        
                        {details?.doctor ? (
                          <>
                            {/* Large Doctor Portrait */}
                            <div className="relative mb-4">
                              {details.doctor.imageUrl ? (
                                <img 
                                  src={details.doctor.imageUrl} 
                                  alt={`Dr. ${details.doctor.user?.firstName} ${details.doctor.user?.lastName}`}
                                  className="w-36 h-44 rounded-2xl object-cover object-center border-4 border-white shadow-2xl"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`w-36 h-44 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white border-4 border-white shadow-2xl ${details.doctor.imageUrl ? 'hidden' : ''}`}
                              >
                                <span className="text-6xl font-bold">
                                  {details.doctor.user?.firstName?.[0] || 'D'}{details.doctor.user?.lastName?.[0] || ''}
                                </span>
                              </div>
                              {/* Availability Badge */}
                              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-7 h-7 rounded-full border-4 border-white shadow-xl ${details.doctor.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} title={details.doctor.isAvailable ? 'Available' : 'Unavailable'}></div>
                            </div>
                            
                            {/* Doctor Info */}
                            <div className="text-center">
                              <h3 className="font-bold text-gray-900 text-base mb-1">
                                Dr. {details.doctor.user?.firstName} {details.doctor.user?.lastName}
                              </h3>
                              {details.doctor.specialties && details.doctor.specialties.length > 0 && (
                                <p className="text-xs text-gray-600 font-semibold mb-1">
                                  {details.doctor.specialties[0].name}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 font-mono bg-white/60 px-2 py-1 rounded">
                                {details.doctor.licenseNumber}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="w-36 h-44 rounded-2xl bg-gray-200 flex items-center justify-center mb-4 border-4 border-white shadow-2xl">
                              <UserIcon className="w-16 h-16 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              {appointment.doctorId ? 'Doctor Assigned' : 'Pending Assignment'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Ticket Information */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Main Ticket Content */}
                          <div className="flex-1 space-y-5">
                            {/* Ticket Header with Appointment Number */}
                            <div className="flex items-start justify-between pb-4 border-b-2 border-gray-200">
                              <div className="flex-1">
                                <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg mb-3">
                                  <span className="text-xs font-bold mr-3 opacity-90 tracking-wider">APPT #</span>
                                  <span className="text-3xl font-black tracking-wider">
                                    {formatAppointmentNumber(appointment.appointmentNumber)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${getStatusBadgeColor(appointment.status)}`}>
                                    {getStatusIcon(appointment.status)}
                                    <span className="ml-1.5">{appointment.status}</span>
                                  </span>
                                  <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${getPaymentStatusBadgeColor(appointment.paymentStatus)}`}>
                                    {appointment.paymentStatus}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Consultation Type Icon */}
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                {getConsultationTypeIcon(appointment.consultationType)}
                              </div>
                            </div>

                            {/* Appointment Details Grid - Professional Layout */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Date */}
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center text-blue-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                                  <Calendar className="w-4 h-4 mr-1.5" />
                                  <span>Date</span>
                                </div>
                                <p className="font-bold text-gray-900 text-lg">{formatDate(appointment.appointmentDate)}</p>
                              </div>
                              
                              {/* Time */}
                              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex items-center text-indigo-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                                  <Clock className="w-4 h-4 mr-1.5" />
                                  <span>Time</span>
                                </div>
                                <p className="font-bold text-gray-900 text-lg">{formatTime(appointment.appointmentTime)}</p>
                              </div>

                              {/* Duration */}
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                                <div className="text-purple-600 text-xs font-semibold mb-2 uppercase tracking-wide">Duration</div>
                                <p className="font-bold text-gray-900 text-lg">{appointment.duration} min</p>
                              </div>
                              
                              {/* Fee */}
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                <div className="text-green-600 text-xs font-semibold mb-2 uppercase tracking-wide">Fee</div>
                                <p className="font-bold text-green-700 text-lg">{formatCurrency(appointment.consultationFee)}</p>
                              </div>
                            </div>

                            {/* Patient & Hospital Info - Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-gray-200">
                              {/* Patient */}
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                                  <UserIcon className="w-4 h-4 mr-1.5" />
                                  <span>Patient</span>
                                </div>
                                {details?.patient ? (
                                  <div>
                                    <p className="font-bold text-gray-900 text-base">{details.patient.firstName} {details.patient.lastName}</p>
                                    {details.patient.phone && (
                                      <p className="text-xs text-gray-600 mt-1.5 flex items-center">
                                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                                        {details.patient.phone}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">ID: {appointment.patientId.substring(0, 8)}...</p>
                                )}
                              </div>

                              {/* Hospital (if exists) */}
                              {appointment.hospitalId && details?.hospital && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                  <div className="flex items-center text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                                    <Building2 className="w-4 h-4 mr-1.5" />
                                    <span>Hospital</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {details.hospital.logoUrl ? (
                                      <img 
                                        src={details.hospital.logoUrl} 
                                        alt={details.hospital.name}
                                        className="w-10 h-10 rounded-lg object-contain border-2 border-gray-200 bg-white shadow-sm"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
                                        <Building2 className="w-5 h-5 text-white" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-gray-900 text-sm">{details.hospital.name}</p>
                                      <p className="text-xs text-gray-600">{details.hospital.type}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Reason */}
                            {appointment.reason && (
                              <div className="pt-3 border-t-2 border-gray-200">
                                <p className="text-xs text-gray-500 font-semibold mb-1.5 uppercase tracking-wide">Reason for Visit</p>
                                <p className="text-sm text-gray-900 font-medium bg-gray-50 rounded-lg p-3 border border-gray-200">{appointment.reason}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons - Right Side */}
                          <div className="flex flex-col items-center space-y-2 lg:border-l-2 lg:border-dashed lg:border-gray-300 lg:pl-6 lg:min-w-[120px]">
                            {appointment.consultationType === 'VIDEO' && 
                             appointment.status !== 'CANCELLED' && 
                             appointment.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStartVideoCall(appointment)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium flex items-center justify-center gap-2"
                                title="Start Video Call"
                              >
                                <Video className="w-4 h-4" />
                                <span>Call</span>
                              </button>
                            )}
                            
                            {/* Assign Doctor Button */}
                            {!appointment.doctorId && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenAssignDoctorModal(appointment);
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium flex items-center justify-center gap-2"
                                title="Assign Doctor"
                              >
                                <UserIcon className="w-4 h-4" />
                                <span>Assign</span>
                              </button>
                            )}

                            {/* Pay Button */}
                            {(appointment.paymentStatus !== 'PAID' && appointment.paymentStatus !== 'REFUNDED') && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenPaymentModal(appointment);
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium flex items-center justify-center gap-2"
                                title="Process Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                                <span>Pay</span>
                              </button>
                            )}
                            
                            {/* Print Receipt Button */}
                            {appointment.paymentStatus === 'PAID' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePrintReceipt(appointment);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium flex items-center justify-center gap-2"
                                title="Print Receipt"
                              >
                                <Printer className="w-4 h-4" />
                                <span>Receipt</span>
                              </button>
                            )}
                            
                            {/* Status Dropdown */}
                            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                              <select
                                value={appointment.status}
                                onChange={(e) => handleStatusChange(appointment.id, e.target.value as AppointmentStatus)}
                                className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer font-medium"
                                title="Change Status"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">✓ Complete</option>
                                <option value="NO_SHOW">No Show</option>
                              </select>
                            )}
                            
                            {/* Edit & Cancel Buttons */}
                            <div className="flex gap-2 w-full">
                              {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleEdit(appointment)}
                                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleCancel(appointment.id)}
                                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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
