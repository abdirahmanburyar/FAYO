'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { paymentApi, Payment } from '@/services/paymentApi';
import { appointmentsApi, Appointment } from '@/services/appointmentsApi';
import { getHospitalId } from '@/utils/hospital';
import { SkeletonTable } from '@/components/skeletons';

export default function PaymentReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointments, setAppointments] = useState<Map<string, Appointment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hospitalId = getHospitalId();
      if (!hospitalId) {
        setError('Hospital ID not found. Please log in again.');
        return;
      }

      // First, get all appointments for this hospital
      const hospitalAppointments = await appointmentsApi.getAppointments({ hospitalId });
      const appointmentsMap = new Map<string, Appointment>();
      hospitalAppointments.forEach(apt => {
        appointmentsMap.set(apt.id, apt);
      });
      setAppointments(appointmentsMap);

      // Get payments for all appointments
      const appointmentIds = hospitalAppointments.map(apt => apt.id);
      const allPayments: Payment[] = [];
      
      for (const appointmentId of appointmentIds) {
        try {
          const appointmentPayments = await paymentApi.getPaymentsByAppointment(appointmentId);
          allPayments.push(...appointmentPayments);
        } catch (err) {
          // Some appointments may not have payments, continue
          console.warn(`No payments found for appointment ${appointmentId}`);
        }
      }

      // Apply filters
      let filteredPayments = allPayments;
      
      if (filterStatus !== 'ALL') {
        filteredPayments = filteredPayments.filter(p => p.paymentStatus === filterStatus);
      }
      
      if (filterMethod !== 'ALL') {
        filteredPayments = filteredPayments.filter(p => p.paymentMethod === filterMethod);
      }
      
      if (startDate || endDate) {
        filteredPayments = filteredPayments.filter(p => {
          const paymentDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt);
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (paymentDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (paymentDate > end) return false;
          }
          return true;
        });
      }

      // Sort by date (newest first)
      filteredPayments.sort((a, b) => {
        const dateA = a.paymentDate ? new Date(a.paymentDate) : new Date(a.createdAt);
        const dateB = b.paymentDate ? new Date(b.paymentDate) : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setPayments(filteredPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch payment reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus, filterMethod, startDate, endDate]);

  const filteredPayments = payments.filter(payment => {
    if (searchTerm === '') return true;
    
    const appointment = appointments.get(payment.appointmentId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      payment.receiptNumber?.toLowerCase().includes(searchLower) ||
      payment.transactionId?.toLowerCase().includes(searchLower) ||
      payment.appointmentId.toLowerCase().includes(searchLower) ||
      (appointment?.appointmentNumber && String(appointment.appointmentNumber).includes(searchLower))
    );
  });

  const totalRevenue = filteredPayments
    .filter(p => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    // Amount is in cents from payment API
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'REFUNDED':
        return <RefreshCw className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CARD':
      case 'CASH':
      case 'MOBILE_MONEY':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
          <p className="text-gray-600 mt-2">View and manage payment transactions</p>
        </div>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (error && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
          <p className="text-gray-600 mt-2">View and manage payment transactions</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Payments</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchPayments}
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
          <p className="text-gray-600 mt-2">View and manage payment transactions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchPayments}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredPayments.filter(p => p.paymentStatus === 'PAID').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by receipt number, transaction ID, or appointment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => {
                  const appointment = appointments.get(payment.appointmentId);
                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.receiptNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        #{appointment?.appointmentNumber || payment.appointmentId.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          {getMethodIcon(payment.paymentMethod)}
                          <span className="ml-2">{payment.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(payment.paymentStatus)}`}>
                          {getStatusIcon(payment.paymentStatus)}
                          <span className="ml-1">{payment.paymentStatus}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(payment.paymentDate || payment.createdAt)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

