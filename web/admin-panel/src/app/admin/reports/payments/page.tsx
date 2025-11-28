'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  DollarSign,
  CreditCard,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Download
} from 'lucide-react';
import { paymentApi, Payment } from '@/services/paymentApi';

export default function PaymentReportsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  // Payment report state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentFilters, setPaymentFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'ALL',
    method: 'ALL'
  });

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  // Fetch payments for payment report
  useEffect(() => {
    fetchPayments();
  }, [paymentFilters, selectedPeriod]);

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      setPaymentError(null);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Build filters object
      const filters: any = {};
      
      // Use explicit date filters if set, otherwise use period-based dates
      // Only apply date filters if at least one is explicitly set or we're using period selector
      if (paymentFilters.startDate) {
        filters.startDate = paymentFilters.startDate;
      } else if (!paymentFilters.endDate) {
        // Use period-based start date if no explicit dates are set
        filters.startDate = startDate.toISOString().split('T')[0];
      }
      
      if (paymentFilters.endDate) {
        filters.endDate = paymentFilters.endDate;
      } else if (!paymentFilters.startDate) {
        // Use period-based end date if no explicit dates are set
        filters.endDate = endDate.toISOString().split('T')[0];
      }
      
      if (paymentFilters.status !== 'ALL') {
        filters.paymentStatus = paymentFilters.status;
      }
      
      if (paymentFilters.method !== 'ALL') {
        filters.paymentMethod = paymentFilters.method;
      }

      console.log('Fetching payments with filters:', filters);

      // Fetch payments directly using the findAll endpoint
      const allPayments = await paymentApi.getAllPayments(filters);
      
      console.log('Fetched payments:', allPayments);
      console.log('Fetched payments count:', allPayments?.length || 0);
      setPayments(allPayments);

      // Calculate stats
      const paidPayments = allPayments.filter(p => p.paymentStatus === 'PAID');
      const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      const byMethod = allPayments.reduce((acc: any, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
        return acc;
      }, {});
      const byStatus = allPayments.reduce((acc: any, p) => {
        acc[p.paymentStatus] = (acc[p.paymentStatus] || 0) + 1;
        return acc;
      }, {});

      setPaymentStats({
        total: allPayments.length,
        paid: paidPayments.length,
        totalRevenue,
        byMethod,
        byStatus,
        averageAmount: paidPayments.length > 0 ? totalRevenue / paidPayments.length : 0
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to fetch payments');
      setPayments([]);
      setPaymentStats(null);
    } finally {
      setLoadingPayments(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/reports')}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Reports</h1>
            <p className="text-gray-600 mt-2">
              Payment transactions and financial records
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={paymentFilters.startDate}
              onChange={(e) => setPaymentFilters({ ...paymentFilters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={paymentFilters.endDate}
              onChange={(e) => setPaymentFilters({ ...paymentFilters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={paymentFilters.status}
              onChange={(e) => setPaymentFilters({ ...paymentFilters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentFilters.method}
              onChange={(e) => setPaymentFilters({ ...paymentFilters, method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        </div>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">Error loading payments</p>
          </div>
          <p className="text-red-600 text-sm mt-1">{paymentError}</p>
        </div>
      )}

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{paymentStats.total}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">{paymentStats.paid}</p>
                <p className="text-sm text-gray-500">
                  {paymentStats.total > 0 
                    ? ((paymentStats.paid / paymentStats.total) * 100).toFixed(1) 
                    : 0}% success rate
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(paymentStats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(paymentStats.averageAmount)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Distribution */}
      {paymentStats && paymentStats.byMethod && Object.keys(paymentStats.byMethod).length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(paymentStats.byMethod).map(([method, count]: [string, any]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{method.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / paymentStats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Status Distribution */}
      {paymentStats && paymentStats.byStatus && Object.keys(paymentStats.byStatus).length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
          <div className="space-y-3">
            {Object.entries(paymentStats.byStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{status}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'PAID' ? 'bg-green-600' :
                        status === 'REFUNDED' ? 'bg-gray-600' :
                        status === 'CANCELLED' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}
                      style={{ width: `${(count / paymentStats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
        {loadingPayments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No payments found</p>
            {!paymentError && (
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Receipt #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paid By</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 50).map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{payment.receiptNumber || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {payment.processedAt ? formatDate(payment.processedAt) : formatDate(payment.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        payment.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-800' :
                        payment.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{payment.paidBy || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length > 50 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 50 of {payments.length} payments
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

