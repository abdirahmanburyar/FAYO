'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import { appointmentsApi, Appointment } from '@/services/appointmentsApi';
import { paymentApi, Payment } from '@/services/paymentApi';
import { usersApi, User } from '@/services/usersApi';
import { doctorApi, Doctor } from '@/services/doctorApi';
import { hospitalApi, Hospital } from '@/services/hospitalApi';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [patient, setPatient] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceiptData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch appointment
        const appointmentData = await appointmentsApi.getAppointmentById(appointmentId);
        setAppointment(appointmentData);

        // Fetch payment
        const payments = await paymentApi.getPaymentsByAppointment(appointmentId);
        if (!payments || payments.length === 0) {
          setError('No payment found for this appointment.');
          return;
        }
        const completedPayment = payments.find(p => p.paymentStatus === 'COMPLETED') || payments[0];
        setPayment(completedPayment);

        // Fetch related data
        const [patientData, doctorData, hospitalData] = await Promise.all([
          usersApi.getUserById(appointmentData.patientId),
          doctorApi.getDoctorById(appointmentData.doctorId),
          appointmentData.hospitalId ? hospitalApi.getHospitalById(appointmentData.hospitalId) : Promise.resolve(null),
        ]);

        setPatient(patientData);
        setDoctor(doctorData);
        setHospital(hospitalData);
      } catch (err) {
        console.error('Error loading receipt data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load receipt data');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      loadReceiptData();
    }
  }, [appointmentId]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const ReceiptSection = ({ copyType }: { copyType: 'patient' | 'hospital' }) => {
    if (!appointment || !payment) return null;

    // Format patient name and phone
    const patientInfo = patient 
      ? `${patient.firstName} ${patient.lastName}${patient.phone ? ` - ${patient.phone}` : ''}`
      : 'N/A';

    return (
      <div className={`receipt-section ${copyType === 'patient' ? 'border-t-2 border-blue-600' : 'border-t-2 border-green-600'} p-3 border border-gray-300 bg-white`}>
        {/* Header Section */}
        <div className="mb-2">
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 uppercase">Healthcare Department</h2>
              <h3 className="text-xs font-semibold text-gray-800">Receipt Voucher</h3>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">F</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-700">
            <p className="font-semibold">
              {hospital 
                ? hospital.name 
                : doctor && doctor.user 
                  ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
                  : 'FAYO HEALTHCARE'}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-400 my-1.5"></div>

        {/* Receipt Details */}
        <div className="mb-2 space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-gray-700">No. Rc.</span>
            <span className="text-[10px] font-bold text-gray-900">{payment.receiptNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-gray-700">Date:</span>
            <span className="text-[10px] font-medium text-gray-900">
              {payment.processedAt ? formatDate(payment.processedAt) : formatDate(payment.createdAt)}
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-300 my-1.5"></div>

        {/* Patient Name and Phone */}
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Patient</p>
          <p className="text-[10px] font-medium text-gray-900 border-b border-gray-300 pb-0.5">
            {patientInfo}
          </p>
        </div>

        {/* Simplified Transaction Details */}
        <div className="mb-2 space-y-1.5">
          {/* Doctor */}
          {doctor && (
            <div>
              <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Doctor</p>
              <p className="text-[10px] font-medium text-gray-900 border-b border-gray-300 pb-0.5">
                {doctor.user ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'N/A'}
                {doctor.specialties && doctor.specialties.length > 0 && (
                  <span className="text-gray-600"> - {(doctor.specialties as any[]).map((s: any) => s.name || s).join(', ')}</span>
                )}
                {!doctor.specialties && (doctor as any).specialty && (
                  <span className="text-gray-600"> - {(doctor as any).specialty}</span>
                )}
              </p>
            </div>
          )}

          {/* Hospital (if exists) */}
          {hospital && (
            <div>
              <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Hospital</p>
              <p className="text-[10px] font-medium text-gray-900 border-b border-gray-300 pb-0.5">
                {hospital.name}
              </p>
            </div>
          )}

          {/* Appointment Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Date</p>
              <p className="text-[10px] font-medium text-gray-900 border-b border-gray-300 pb-0.5">
                {formatDate(appointment.appointmentDate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Time</p>
              <p className="text-[10px] font-medium text-gray-900 border-b border-gray-300 pb-0.5">
                {formatTime(appointment.appointmentTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-300 my-1.5"></div>

        {/* Amount Section */}
        <div className="mb-2">
          <div className="flex justify-between items-center py-1.5 bg-gray-50 px-2 rounded">
            <span className="text-xs font-bold text-gray-900">Amount:</span>
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(payment.amount, payment.currency)}
            </span>
          </div>
        </div>

        {/* Copy Type */}
        <div className="mt-2 pt-2 border-t-2 border-gray-400">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Copy</p>
              <p className="text-[10px] font-bold text-gray-900 uppercase">
                {copyType === 'patient' ? 'PATIENT' : 'HOSPITAL/DOCTOR'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Receipt not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.4cm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          
          /* Hide all screen elements */
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Show only print wrapper */
          .receipt-print-wrapper {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0.4cm !important;
            background: white !important;
            box-sizing: border-box !important;
          }
          
          .receipt-print-wrapper * {
            visibility: visible !important;
          }
          
          .receipt-print-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.3cm !important;
            width: 100% !important;
            height: calc(100% - 0.8cm) !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          
          .receipt-section {
            width: 100% !important;
            height: calc(50% - 0.15cm) !important;
            min-height: calc(50% - 0.15cm) !important;
            max-height: calc(50% - 0.15cm) !important;
            border: 1px solid #d1d5db !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: white !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            padding: 0.4cm !important;
          }
          
          .receipt-section * {
            margin: 0 !important;
          }
        }
        
        @media screen {
          .receipt-print-wrapper {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen View */}
      <div className="min-h-screen bg-gray-50">
        {/* Header with Print and Back buttons */}
        <div className="bg-white border-b border-gray-200 p-4 no-print">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Payment Receipt</h1>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>

        {/* Receipt Content - Screen View */}
        <div className="max-w-4xl mx-auto p-4">
          <div className="grid grid-cols-1 gap-6">
            <ReceiptSection copyType="patient" />
            <ReceiptSection copyType="hospital" />
          </div>
        </div>
      </div>

      {/* Print View - Only visible when printing */}
      <div className="receipt-print-wrapper">
        <div className="receipt-print-container">
          <ReceiptSection copyType="patient" />
          <ReceiptSection copyType="hospital" />
        </div>
      </div>
    </>
  );
}

