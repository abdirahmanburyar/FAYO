'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { Appointment } from '@/services/appointmentsApi';
import { Payment } from '@/services/paymentApi';
import { User } from '@/services/usersApi';
import { Doctor } from '@/services/doctorApi';
import { Hospital } from '@/services/hospitalApi';

interface PaymentReceiptProps {
  appointment: Appointment;
  payment: Payment;
  patient?: User;
  doctor?: Doctor;
  hospital?: Hospital;
  onClose: () => void;
}

export default function PaymentReceipt({
  appointment,
  payment,
  patient,
  doctor,
  hospital,
  onClose,
}: PaymentReceiptProps) {
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

  const ReceiptSection = ({ title, copyType }: { title: string; copyType: 'patient' | 'hospital' }) => (
    <div className={`receipt-section ${copyType === 'patient' ? 'border-t-2 border-blue-600' : 'border-t-2 border-green-600'} p-4 border border-gray-300 bg-white`}>
      <div className="text-center mb-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-600 mt-1">
          {copyType === 'patient' ? 'PATIENT COPY' : 'HOSPITAL/DOCTOR COPY'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Receipt #: {payment.receiptNumber || 'N/A'}</p>
      </div>

      <div className="h-px bg-gray-300 my-3"></div>

      {/* Doctor */}
      {doctor && (
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Doctor:</span>
            <span className="text-sm font-medium text-gray-900">
              {doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}` : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Hospital (if exists) */}
      {hospital && (
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Hospital:</span>
            <span className="text-sm font-medium text-gray-900">{hospital.name}</span>
          </div>
        </div>
      )}

      {/* Appointment Date & Time */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Date:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(appointment.appointmentDate)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Time:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatTime(appointment.appointmentTime)}
          </span>
        </div>
      </div>

      <div className="h-px bg-gray-300 my-3"></div>

      {/* Fee */}
      <div className="text-center">
        <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(payment.amount, payment.currency)}
        </p>
      </div>

      <div className="h-px bg-gray-300 my-3"></div>

      {/* Footer */}
      <div className="text-center mt-3">
        <p className="text-xs text-gray-500">
          Thank you for your payment
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          {copyType === 'patient' ? 'Patient Copy' : 'Hospital/Doctor Copy'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          .receipt-print-container,
          .receipt-print-container * {
            visibility: visible;
          }
          .receipt-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1cm;
            padding: 1cm !important;
            height: calc(100% - 2cm);
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .receipt-section {
            page-break-inside: avoid;
            margin: 0 !important;
            border: 1px solid #d1d5db !important;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header with Print and Close buttons */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-gray-900">Payment Receipt</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="receipt-print-container receipt-container p-4">
            <ReceiptSection title="Payment Receipt" copyType="patient" />
            <ReceiptSection title="Payment Receipt" copyType="hospital" />
          </div>
        </div>
      </div>
    </>
  );
}

