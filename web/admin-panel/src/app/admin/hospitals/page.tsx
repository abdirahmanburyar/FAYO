'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { hospitalApi, Hospital } from '@/services/hospitalApi';
import { SkeletonStats, SkeletonCard } from '@/components/skeletons';
import { SearchableSelect, SelectOption } from '@/components/ui';

export default function HospitalsPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Fetch hospitals from API
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      const hospitalsData = await hospitalApi.getHospitals();
      console.log('🏥 All Hospitals Data:', hospitalsData);
      hospitalsData.forEach((hospital, index) => {
        console.log(`🏥 Hospital ${index + 1} (${hospital.name}):`, {
          departments: hospital.departments,
          services: hospital.services
        });
      });
      setHospitals(hospitalsData);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = 
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.phone?.includes(searchTerm);

    const matchesCity = filterCity === 'ALL' || hospital.city === filterCity;
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && hospital.isActive) ||
      (filterStatus === 'INACTIVE' && !hospital.isActive);
    const matchesType = filterType === 'ALL' || hospital.type === filterType;

    return matchesSearch && matchesCity && matchesStatus && matchesType;
  });

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Get unique cities for filter
  const cities = Array.from(new Set(hospitals.map(hospital => hospital.city)));
  
  // Prepare filter options
  const cityOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Cities' },
    ...cities.map(city => ({ value: city, label: city }))
  ];
  
  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' }
  ];
  
  const typeOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Types' },
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'CLINIC', label: 'Clinic' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <SkeletonStats count={4} />

        {/* Filters Skeleton */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Hospitals Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospitals & Clinics</h1>
          <p className="text-gray-600 mt-2">Manage healthcare facilities and their information</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Hospitals</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
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
          <h1 className="text-3xl font-bold text-gray-900">Hospitals & Clinics</h1>
          <p className="text-gray-600 mt-2">
            Manage healthcare facilities and their information
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/admin/hospitals/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Hospital</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hospitals</p>
              <p className="text-2xl font-bold text-gray-900">{hospitals.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Active Hospitals</p>
              <p className="text-2xl font-bold text-green-600">
                {hospitals.filter(h => h.isActive).length}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Cities</p>
              <p className="text-2xl font-bold text-purple-600">
                {cities.length}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-purple-600" />
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
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-orange-600">
                {hospitals.reduce((total, hospital) => total + (hospital.doctors?.length || 0), 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* City Filter */}
          <div className="lg:w-48">
            <SearchableSelect
              options={cityOptions}
              value={filterCity}
              onChange={(value) => setFilterCity(value as string)}
              placeholder="All Cities"
              searchPlaceholder="Search cities..."
              allowClear={false}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <SearchableSelect
              options={statusOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as string)}
              placeholder="All Status"
              searchPlaceholder="Search status..."
              allowClear={false}
            />
          </div>

          {/* Type Filter */}
          <div className="lg:w-48">
            <SearchableSelect
              options={typeOptions}
              value={filterType}
              onChange={(value) => setFilterType(value as string)}
              placeholder="All Types"
              searchPlaceholder="Search types..."
              allowClear={false}
            />
          </div>
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital, index) => (
          <motion.div
            key={hospital.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            {/* Gradient Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${
              hospital.type === 'HOSPITAL' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600'
            }`} />

            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex items-center space-x-3">
                {hospital.logoUrl ? (
                  <img 
                    src={hospital.logoUrl} 
                    alt={hospital.name}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-200"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm ${
                    hospital.type === 'HOSPITAL'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => router.push(`/admin/hospitals/${hospital.id}`)}
                    className="text-left hover:text-blue-600 transition-colors group-hover:text-blue-700"
                  >
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {hospital.name}
                    </h3>
                  </button>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-sm text-gray-500 font-medium">{hospital.city}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      hospital.type === 'HOSPITAL' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {hospital.type}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => router.push(`/admin/hospitals/${hospital.id}`)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => router.push(`/admin/hospitals/${hospital.id}/edit`)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" 
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="truncate leading-tight">{hospital.address}</span>
              </div>

              {hospital.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{hospital.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hospital.isActive 
                    ? 'bg-green-50 text-green-700 border border-green-100' 
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {hospital.isActive ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                  )}
                </span>
                
                <span className="text-xs font-medium text-gray-500 flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {hospital.doctors?.length || 0} doctors
                </span>
              </div>

              {/* Footer: Quick Stats */}
              <div className="grid grid-cols-2 gap-2 pt-4 mt-2 border-t border-gray-100">
                <div className="text-center px-2 py-1.5 bg-gray-50 rounded-lg">
                  <span className="block text-xs text-gray-500 uppercase font-semibold tracking-wider">Services</span>
                  <span className="block text-sm font-bold text-gray-900">{hospital.services?.length || 0}</span>
                </div>
                <div className="text-center px-2 py-1.5 bg-gray-50 rounded-lg">
                  <span className="block text-xs text-gray-500 uppercase font-semibold tracking-wider">Depts</span>
                  <span className="block text-sm font-bold text-gray-900">{hospital.departments?.length || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredHospitals.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
