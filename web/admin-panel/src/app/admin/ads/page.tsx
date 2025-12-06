'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  MousePointerClick,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { adsApi, Ad, AdStatus, AdType } from '@/services/adsApi';
import { getAdsWebSocketService, AdsWebSocketEvent } from '@/services/adsWebSocket';
import { SkeletonStats, SkeletonTable } from '@/components/skeletons';
import { SearchableSelect, SelectOption } from '@/components/ui';

export default function AdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  const fetchAds = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adsApi.getAds(false, page, limit);
      setAds(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    const wsService = getAdsWebSocketService();

    const handleAdCreated = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] New ad created:', event.ad);
      if (event.ad) {
        setAds((prev) => {
          if (prev.some((a) => a.id === event.ad!.id)) {
            return prev;
          }
          return [event.ad, ...prev];
        });
        fetchAds(currentPage, itemsPerPage);
      }
    };

    const handleAdUpdated = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad updated:', event.ad);
      if (event.ad) {
        setAds((prev) =>
          prev.map((a) => (a.id === event.ad!.id ? event.ad : a))
        );
      }
    };

    const handleAdDeleted = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad deleted:', event.adId);
      if (event.adId) {
        setAds((prev) => prev.filter((a) => a.id !== event.adId));
        fetchAds(currentPage, itemsPerPage);
      }
    };

    const handleAdClicked = (event: AdsWebSocketEvent) => {
      console.log('📥 [AdsPage] Ad clicked:', event.ad);
      if (event.ad) {
        setAds((prev) =>
          prev.map((a) => (a.id === event.ad!.id ? event.ad : a))
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
  }, [currentPage, itemsPerPage]);

  const handleDelete = async (ad: Ad) => {
    if (!confirm(`Are you sure you want to delete ad "${ad.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingAdId(ad.id);
      await adsApi.deleteAd(ad.id);
      await fetchAds(currentPage, itemsPerPage);
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete ad');
    } finally {
      setDeletingAdId(null);
    }
  };

  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || ad.status === filterStatus;
    const matchesType = filterType === 'ALL' || ad.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeColor = (status: AdStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: AdType) => {
    switch (type) {
      case 'BANNER':
        return 'bg-blue-100 text-blue-800';
      case 'CAROUSEL':
        return 'bg-purple-100 text-purple-800';
      case 'INTERSTITIAL':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'EXPIRED', label: 'Expired' },
  ];

  const typeOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Types' },
    { value: 'BANNER', label: 'Banner' },
    { value: 'CAROUSEL', label: 'Carousel' },
    { value: 'INTERSTITIAL', label: 'Interstitial' },
  ];

  // Calculate stats
  const stats = {
    total: ads.length,
    active: ads.filter((a) => a.status === 'ACTIVE').length,
    pending: ads.filter((a) => a.status === 'PENDING').length,
    totalViews: ads.reduce((sum, a) => sum + a.viewCount, 0),
    totalClicks: ads.reduce((sum, a) => sum + a.clickCount, 0),
  };

  if (loading && ads.length === 0) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={5} />
        <SkeletonTable />
      </div>
    );
  }

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
                onClick={() => fetchAds(currentPage, itemsPerPage)}
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
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
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
              placeholder="Search ads by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="lg:w-48">
            <SearchableSelect
              options={statusOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              placeholder="Filter by status"
            />
          </div>
          <div className="lg:w-48">
            <SearchableSelect
              options={typeOptions}
              value={filterType}
              onChange={(value) => setFilterType(value)}
              placeholder="Filter by type"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchAds(currentPage, itemsPerPage)}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No ads found</p>
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <motion.tr
                    key={ad.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {ad.imageUrl ? (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{ad.title}</p>
                          {ad.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{ad.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(ad.type)}`}>
                        {ad.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(ad.status)}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ad.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ad.endDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{ad.viewCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MousePointerClick className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{ad.clickCount.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{ad.priority}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => router.push(`/admin/ads/${ad.id}/edit`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(ad)}
                          disabled={deletingAdId === ad.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} ads
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

