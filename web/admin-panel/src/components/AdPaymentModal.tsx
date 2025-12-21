'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Building2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adsApi } from '@/services/adsApi';
import { paymentApi } from '@/services/paymentApi';
import { Ad } from '@/services/adsApi';

interface AdPaymentModalProps {
  ad: Ad;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'OTHER';

export default function AdPaymentModal({ ad, isOpen, onClose, onPaymentSuccess }: AdPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [feeInDollars, setFeeInDollars] = useState<string>('0.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [notes, setNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [hasPaid, setHasPaid] = useState(false);

  // Calculate fee when modal opens
  useEffect(() => {
    if (isOpen && ad && ad.id) {
      calculateFee();
      loadPayments();
    }
  }, [isOpen, ad?.id, ad?.range, ad?.price]);

  const calculateFee = async () => {
    try {
      setCalculatingFee(true);
      setError(null);
      // Ensure range and price are valid
      const range = ad.range && typeof ad.range === 'number' ? ad.range : 7;
      // Convert price to number if it's a string/Decimal from Prisma
      const priceValue = ad.price ? (typeof ad.price === 'number' ? ad.price : parseFloat(String(ad.price))) : 0.1;
      const price = priceValue > 0 ? priceValue : 0.1; // Default $0.10/day
      
      const result = await adsApi.calculateFee(range, price);
      
      // Safely extract values with fallbacks
      if (result && typeof result === 'object') {
        setFee(result.fee || null);
        setFeeInDollars(result.feeInDollars || (result.fee ? (result.fee / 100).toFixed(2) : '0.00'));
      } else {
        throw new Error('Invalid response from fee calculation');
      }
    } catch (err) {
      console.error('Error calculating fee:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate fee');
      setFee(null);
      setFeeInDollars('0.00');
    } finally {
      setCalculatingFee(false);
    }
  };

  const loadPayments = async () => {
    try {
      const adPayments = await paymentApi.getPaymentsByAd(ad.id);
      setPayments(adPayments);
      setHasPaid(adPayments.some((p: any) => p.paymentStatus === 'PAID'));
    } catch (err) {
      console.error('Error loading payments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fee) return;

    setLoading(true);
    setError(null);

    try {
      // Get current user/admin ID from localStorage
      const adminId = typeof window !== 'undefined' ? localStorage.getItem('adminId') || 'ADMIN' : 'ADMIN';

      const result = await adsApi.payForAd(ad.id, {
        paymentMethod,
        paidBy: adminId,
        processedBy: adminId,
        notes: notes || undefined,
        transactionId: transactionId || undefined,
      });

      // Refresh payments
      await loadPayments();

      // Show success and close
      onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pay for Ad</h2>
                <p className="text-sm text-gray-500">{ad.company}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Ad Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Duration: {ad.range || 0} day{(ad.range || 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Price:</span> ${ad.price ? (typeof ad.price === 'number' ? ad.price : parseFloat(String(ad.price))).toFixed(2) : '0.00'}/day
                </div>
              </div>
            </div>

            {/* Fee Display */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  {calculatingFee ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">${feeInDollars}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Calculation</p>
                  <p className="text-sm text-gray-700">
                    ${ad.price ? (typeof ad.price === 'number' ? ad.price : parseFloat(String(ad.price))).toFixed(2) : '0.00'}/day × {ad.range || 0} days
                  </p>
                  <p className="text-sm text-gray-700 font-semibold">
                    = ${feeInDollars}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {hasPaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Payment Received</p>
                  <p className="text-xs text-green-700">This ad has been paid for and is active.</p>
                </div>
              </div>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          ${(payment.amount / 100).toFixed(2)} - {payment.paymentMethod}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : payment.paymentStatus === 'REFUNDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Form */}
            {!hasPaid && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="CARD">Card</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Transaction ID (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID if available"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !fee || calculatingFee || !feeInDollars || feeInDollars === '0.00'}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ${feeInDollars || '0.00'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Close button if already paid */}
            {hasPaid && (
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

