/**
 * Advertisements Management Page - Professional Redesign
 * 
 * This component provides a comprehensive interface for managing advertisements with:
 * - Real-time updates via WebSocket
 * - Pagination support
 * - Client-side filtering and search
 * - Performance metrics (clicks, views)
 * - CRUD operations (Create, Delete)
 * 
 * Professional Features:
 * - Modern, clean UI design
 * - Enhanced data visualization
 * - Better user experience
 * - Responsive design
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  MousePointerClick,
  Image as ImageIcon,
  RefreshCw,
  DollarSign,
  Eye,
  TrendingUp,
  Filter,
  X,
  Edit,
  MoreVertical,
  BarChart3,
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Base URL for ad images - use unified API service
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.62.51.50:3001/api/v1';
  const adsServiceUrl = apiUrl.replace('/api/v1', '');

  // Load payments for ads
  const loadAdPayments = useCallback(async (adIds: string[]) => {
    try {
      const paymentsMap: Record<string, any[]> = {};
      await Promise.all(
        adIds.map(async (adId) => {
          try {
            const payments = await paymentApi.getPaymentsByAd(adId);
            paymentsMap[adId] = payments;
          } catch (err) {
            console.error(`Error loading payments for ad ${adId}:`, err);
            paymentsMap[adId] = [];
          }
        })
      );
      setAdPayments(paymentsMap);
    } catch (err) {
      console.error('Error loading ad payments:', err);
    }
  }, []);

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
      
      // Load payments for all ads
      if (response.data.length > 0) {
        await loadAdPayments(response.data.map((ad) => ad.id));
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ads';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadAdPayments]);

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
        fetchAds(pagination.page, pagination.limit, true);
      }
    };

    const handleAdUpdated = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad updated:', event.ad);
      if (event.ad) {
        setAds((prev) =>
          prev.map((a) => (a.id === event.ad!.id ? { ...a, ...event.ad } : a))
        );
      }
    };

    const handleAdDeleted = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad deleted:', event.adId);
      if (event.adId) {
        setAds((prev) => prev.filter((a) => a.id !== event.adId));
        fetchAds(pagination.page, pagination.limit, true);
      }
    };

    const handleAdClicked = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad clicked:', event.ad);
      if (event.ad) {
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
      await fetchAds(pagination.page, pagination.limit, true);
    } catch (err) {
      console.error('Error deleting ad:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ad';
      alert(errorMessage);
    } finally {
      setDeletingAdId(null);
    }
  };

  // Client-side filtering
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    { value: 'PENDING', label: 'Pending' },
  ], []);

  // Calculate stats from filtered ads
  const stats = useMemo(() => ({
    total: pagination.total,
    displayed: filteredAds.length,
    published: filteredAds.filter((a) => a.status === 'PUBLISHED').length,
    inactive: filteredAds.filter((a) => a.status === 'INACTIVE').length,
    pending: filteredAds.filter((a) => a.status === 'PENDING').length,
    totalClicks: filteredAds.reduce((sum, a) => sum + a.clickCount, 0),
    totalViews: filteredAds.reduce((sum, a) => sum + (a.viewCount || 0), 0),
    totalRevenue: filteredAds.reduce((sum, a) => {
      const payments = adPayments[a.id] || [];
      return sum + payments
        .filter((p: any) => p.paymentStatus === 'PAID')
        .reduce((pSum: number, p: any) => pSum + p.amount, 0);
    }, 0),
  }), [filteredAds, pagination.total, adPayments]);

  // Show loading skeleton on initial load
  if (loading && ads.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={5} />
        <SkeletonTable />
      </div>
    );
  }

  // Show error state
  if (error && ads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Ads</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => fetchAds(pagination.page, pagination.limit)}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
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
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advertisement Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor your advertising campaigns</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/admin/ads/create')}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Ad</span>
        </motion.button>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-md">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">
              Total
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Total Advertisements</p>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            {stats.displayed !== stats.total && (
              <p className="text-xs text-blue-600 mt-1">{stats.displayed} displayed</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500 rounded-xl shadow-md">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-200 px-3 py-1 rounded-full">
              Active
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 mb-1">Published Ads</p>
            <p className="text-3xl font-bold text-emerald-900">{stats.published}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% of total
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-xl shadow-md">
              <MousePointerClick className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-3 py-1 rounded-full">
              Engagement
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-purple-700 mb-1">Total Clicks</p>
            <p className="text-3xl font-bold text-purple-900">{stats.totalClicks.toLocaleString()}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Eye className="w-3 h-3 text-purple-600" />
              <p className="text-xs text-purple-600">{stats.totalViews.toLocaleString()} views</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500 rounded-xl shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">
              Revenue
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-700 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-amber-900">${(stats.totalRevenue / 100).toFixed(2)}</p>
            <p className="text-xs text-amber-600 mt-1">From paid ads</p>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID, company name, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <div className="lg:w-56">
            <SearchableSelect
              options={statusOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(Array.isArray(value) ? value[0] : value)}
              placeholder="Filter by status"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchAds(pagination.page, pagination.limit, true)}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </motion.button>
        </div>
      </div>

      {/* Ads Grid/List */}
      <AnimatePresence mode="wait">
        {filteredAds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-16 text-center"
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Megaphone className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No advertisements found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'ALL'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by creating your first advertisement campaign.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/admin/ads/create')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Ad</span>
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAds.map((ad, index) => {
              const payments = adPayments[ad.id] || [];
              const hasPaid = payments.some((p: any) => p.paymentStatus === 'PAID');
              const totalPaid = payments
                .filter((p: any) => p.paymentStatus === 'PAID')
                .reduce((sum: number, p: any) => sum + p.amount, 0);

              return (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Enhanced Image Header */}
                  <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {ad.imageUrl ? (
                      <img
                        src={getImageUrl(ad.imageUrl) || ''}
                        alt={`${ad.company} advertisement`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ImageIcon className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border ${getStatusBadgeColor(ad.status)}`}>
                        {ad.status}
                      </span>
                    </div>

                    {/* Company Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <h3 className="text-2xl font-bold text-white drop-shadow-2xl mb-1">{ad.company}</h3>
                      <p className="text-sm text-white/90 drop-shadow-lg">Advertisement Campaign</p>
                    </div>
                  </div>

                  {/* Enhanced Card Content */}
                  <div className="p-6 space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <MousePointerClick className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">Clicks</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">{ad.clickCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">Views</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900">{(ad.viewCount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm font-medium">Start Date</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(ad.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm font-medium">End Date</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(ad.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Duration</span>
                          <span className="text-xs font-semibold text-gray-700">{ad.range} day{ad.range !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className={`rounded-xl p-4 border-2 ${
                      hasPaid 
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300' 
                        : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {hasPaid ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                          )}
                          <span className={`text-sm font-bold ${
                            hasPaid ? 'text-emerald-900' : 'text-amber-900'
                          }`}>
                            {hasPaid ? 'Payment Received' : 'Payment Required'}
                          </span>
                        </div>
                        {hasPaid && (
                          <span className="text-lg font-bold text-emerald-700">
                            ${(totalPaid / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedAdForPayment(ad)}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-md ${
                          hasPaid
                            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                            : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                        }`}
                      >
                        <DollarSign className="w-5 h-5" />
                        <span>{hasPaid ? 'View Payment' : 'Make Payment'}</span>
                      </motion.button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push(`/admin/ads/${ad.id}/edit`)}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-md"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDelete(ad)}
                          disabled={deletingAdId === ad.id}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{deletingAdId === ad.id ? 'Deleting...' : 'Delete'}</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 font-medium">
              Showing <span className="font-bold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-gray-900">{pagination.total}</span> advertisements
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const newPage = Math.max(1, pagination.page - 1);
                  setPagination(prev => ({ ...prev, page: newPage }));
                  fetchAds(newPage, pagination.limit);
                }}
                disabled={pagination.page === 1 || loading}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Previous
              </button>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
                <span className="text-sm font-semibold text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <button
                onClick={() => {
                  const newPage = Math.min(pagination.totalPages, pagination.page + 1);
                  setPagination(prev => ({ ...prev, page: newPage }));
                  fetchAds(newPage, pagination.limit);
                }}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
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
            if (ads.length > 0) {
              loadAdPayments(ads.map((ad) => ad.id));
            }
          }}
          onPaymentSuccess={() => {
            fetchAds(pagination.page, pagination.limit, true);
          }}
        />
      )}
    </div>
  );
}
