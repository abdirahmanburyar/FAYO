/**
 * Advertisements Management Page
 * 
 * This component provides a comprehensive interface for managing advertisements with:
 * - Real-time updates via WebSocket
 * - Pagination support
 * - Client-side filtering and search
 * - Performance metrics (views & clicks)
 * - CRUD operations (Create, Read, Update, Delete)
 * 
 * Key Features:
 * - Optimized with React hooks (useMemo, useCallback) for better performance
 * - Proper state management to avoid unnecessary re-renders
 * - Real-time stats calculation from paginated data
 * - Refresh state indicator for better UX
 * - Improved error handling and loading states
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  MousePointerClick,
  Image as ImageIcon,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { adsApi, Ad, AdStatus } from '@/services/adsApi';
import { getAdsWebSocketService, AdsWebSocketEvent } from '@/services/adsWebSocket';
import { SkeletonStats, SkeletonTable } from '@/components/skeletons';
import { SearchableSelect, SelectOption } from '@/components/ui';
import AdPaymentModal from '@/components/AdPaymentModal';
import { paymentApi } from '@/services/paymentApi';

export default function AdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);
  const [selectedAdForPayment, setSelectedAdForPayment] = useState<Ad | null>(null);
  const [adPayments, setAdPayments] = useState<Record<string, any[]>>({});

  // Base URL for ad images
  const adsServiceUrl = process.env.NEXT_PUBLIC_ADS_SERVICE_URL || 'http://72.62.51.50:3007';

  // Fetch ads from API
  const fetchAds = useCallback(async (page: number = 1, limit: number = 10, showRefreshing: boolean = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await adsApi.getAds(false, page, limit);
      setAds(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching ads:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ads';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAds(pagination.page, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    const wsService = getAdsWebSocketService();

    const handleAdCreated = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] New ad created:', event.ad);
      if (event.ad) {
        // Refetch to update pagination and stats
        fetchAds(pagination.page, pagination.limit, true);
      }
    };

    const handleAdUpdated = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad updated:', event.ad);
      if (event.ad) {
        // Update the ad in the current list if it exists
        setAds((prev) =>
          prev.map((a) => (a.id === event.ad!.id ? { ...a, ...event.ad } : a))
        );
      }
    };

    const handleAdDeleted = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad deleted:', event.adId);
      if (event.adId) {
        // Remove from list and refetch to update pagination
        setAds((prev) => prev.filter((a) => a.id !== event.adId));
        // Refetch to ensure correct pagination
        fetchAds(pagination.page, pagination.limit, true);
      }
    };

    const handleAdClicked = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad clicked:', event.ad);
      if (event.ad) {
        // Update click count in real-time
        setAds((prev) =>
          prev.map((a) =>
            a.id === event.ad!.id
              ? { ...a, clickCount: event.ad!.clickCount, viewCount: event.ad!.viewCount }
              : a
          )
        );
      }
    };

    wsService.on('ad.created', handleAdCreated);
    wsService.on('ad.updated', handleAdUpdated);
    wsService.on('ad.deleted', handleAdDeleted);
    wsService.on('ad.clicked', handleAdClicked);

    return () => {
      wsService.off('ad.created', handleAdCreated);
      wsService.off('ad.updated', handleAdUpdated);
      wsService.off('ad.deleted', handleAdDeleted);
      wsService.off('ad.clicked', handleAdClicked);
    };
  }, [fetchAds, pagination.page, pagination.limit]);

  // Handle ad deletion
  const handleDelete = async (ad: Ad) => {
    if (!confirm(`Are you sure you want to delete the ad for "${ad.company}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAdId(ad.id);
      await adsApi.deleteAd(ad.id);
      // WebSocket will handle the real-time update
      // But we refetch to ensure consistency
      await fetchAds(pagination.page, pagination.limit, true);
    } catch (err) {
      console.error('Error deleting ad:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ad';
      alert(errorMessage);
    } finally {
      setDeletingAdId(null);
    }
  };

  // Client-side filtering (Note: For better performance with large datasets, consider server-side filtering)
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        searchTerm === '' ||
        ad.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(ad.startDate).toLocaleDateString().includes(searchTerm) ||
        new Date(ad.endDate).toLocaleDateString().includes(searchTerm);

      const matchesStatus = filterStatus === 'ALL' || ad.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [ads, searchTerm, filterStatus]);

  // Get status badge color
  const getStatusBadgeColor = useCallback((status: AdStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Format image URL
  const getImageUrl = useCallback((imageUrl: string) => {
    if (!imageUrl) return null;
    return imageUrl.startsWith('http') ? imageUrl : `${adsServiceUrl}${imageUrl}`;
  }, [adsServiceUrl]);

  // Status filter options
  const statusOptions: SelectOption[] = useMemo(() => [
    { value: 'ALL', label: 'All Status' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'INACTIVE', label: 'Inactive' },
  ], []);

  // Calculate stats from filtered ads
  const stats = useMemo(() => ({
    total: pagination.total, // Use total from pagination for accurate count
    displayed: filteredAds.length,
    published: filteredAds.filter((a) => a.status === 'PUBLISHED').length,
    inactive: filteredAds.filter((a) => a.status === 'INACTIVE').length,
    totalViews: filteredAds.reduce((sum, a) => sum + a.viewCount, 0),
    totalClicks: filteredAds.reduce((sum, a) => sum + a.clickCount, 0),
  }), [filteredAds, pagination.total]);

  // Show loading skeleton on initial load
  if (loading && ads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-600 mt-2">Manage advertisements and campaigns</p>
        </div>
        <SkeletonStats count={5} />
        <SkeletonTable />
      </div>
    );
  }

  // Show error state
  if (error && ads.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-600 mt-2">Manage advertisements and campaigns</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Ads</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchAds(pagination.page, pagination.limit)}
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
          <h1 className="text-3xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-600 mt-2">Manage advertisements and campaigns</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/admin/ads/create')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Ad</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              {stats.displayed !== stats.total && (
                <p className="text-xs text-gray-500 mt-1">({stats.displayed} displayed)</p>
              )}
            </div>
            <Megaphone className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.published}</p>
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
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
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
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <MousePointerClick className="w-8 h-8 text-purple-600" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID, company, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="lg:w-48">
            <SearchableSelect
              options={statusOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(Array.isArray(value) ? value[0] : value)}
              placeholder="Filter by status"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchAds(pagination.page, pagination.limit, true)}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </motion.button>
        </div>
      </div>

      {/* Ads Cards Grid */}
      <div className="space-y-4">
        {filteredAds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No ads found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad, index) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Ad Image */}
                <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
                  {ad.imageUrl ? (
                    <img
                      src={getImageUrl(ad.imageUrl) || ''}
                      alt={`${ad.company} ad`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <ImageIcon className={`w-12 h-12 text-gray-400 fallback-icon absolute ${ad.imageUrl ? 'hidden' : ''}`} />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusBadgeColor(ad.status)}`}>
                      {ad.status}
                    </span>
                  </div>
                </div>

                {/* Ad Content */}
                <div className="p-6">
                  {/* Company Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{ad.company}</h3>

                  {/* Date Range */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium mr-2">Start:</span>
                      <span>{new Date(ad.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium mr-2">End:</span>
                      <span>{new Date(ad.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium mr-2">Duration:</span>
                      <span>{ad.range} day{ad.range !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Views</p>
                        <p className="text-sm font-semibold text-gray-900">{ad.viewCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <MousePointerClick className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Clicks</p>
                        <p className="text-sm font-semibold text-gray-900">{ad.clickCount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {(() => {
                    const payments = adPayments[ad.id] || [];
                    const hasPaid = payments.some((p: any) => p.paymentStatus === 'PAID');
                    const totalPaid = payments
                      .filter((p: any) => p.paymentStatus === 'PAID')
                      .reduce((sum: number, p: any) => sum + p.amount, 0);

                    if (hasPaid) {
                      return (
                        <div className="mb-4 pt-4 border-t border-gray-200">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-900">Paid</span>
                            </div>
                            <span className="text-sm font-semibold text-green-700">
                              ${(totalPaid / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="mb-4 pt-4 border-t border-gray-200">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-900">Payment Required</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/admin/ads/${ad.id}/edit`)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelete(ad)}
                        disabled={deletingAdId === ad.id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{deletingAdId === ad.id ? 'Deleting...' : 'Delete'}</span>
                      </motion.button>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedAdForPayment(ad)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Pay for Ad"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Pay for Ad</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} ads
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newPage = Math.max(1, pagination.page - 1);
                  setPagination(prev => ({ ...prev, page: newPage }));
                  fetchAds(newPage, pagination.limit);
                }}
                disabled={pagination.page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => {
                  const newPage = Math.min(pagination.totalPages, pagination.page + 1);
                  setPagination(prev => ({ ...prev, page: newPage }));
                  fetchAds(newPage, pagination.limit);
                }}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedAdForPayment && (
        <AdPaymentModal
          ad={selectedAdForPayment}
          isOpen={!!selectedAdForPayment}
          onClose={() => {
            setSelectedAdForPayment(null);
            // Reload payments
            if (ads.length > 0) {
              loadAdPayments(ads.map((ad) => ad.id));
            }
          }}
          onPaymentSuccess={() => {
            // Refresh ads list
            fetchAds(pagination.page, pagination.limit, true);
          }}
        />
      )}
    </div>
  );
}

