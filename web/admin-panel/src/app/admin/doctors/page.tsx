'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Shield,
  Star,
  MapPin
} from 'lucide-react';
import { doctorApi, Doctor } from '@/services/doctorApi';
import { specialtiesApi } from '@/services/specialtiesApi';
import { SkeletonStats, SkeletonCard } from '@/components/skeletons';
import { SearchableSelect, SelectOption } from '@/components/ui';

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Fetch doctors from API
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const doctorsData = await doctorApi.getDoctors();
      
      // Validate and filter out invalid doctors
      const validDoctors = (doctorsData || []).filter(doctor => {
        if (!doctor || !doctor.id) {
          return false;
        }
        return true;
      });
      
      setDoctors(validDoctors);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    // Add null checks for doctor and user properties
    if (!doctor || !doctor.user) {
      return false;
    }

    const doctorSpecialtyNames = (doctor.specialties || []).map(s => s.name).join(' ');
    const matchesSearch = 
      (doctor.user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorSpecialtyNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.licenseNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = filterSpecialty === 'ALL' || 
      (doctor.specialties || []).some(s => s.name === filterSpecialty || s.id === filterSpecialty);
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'VERIFIED' && doctor.isVerified) ||
      (filterStatus === 'UNVERIFIED' && !doctor.isVerified) ||
      (filterStatus === 'AVAILABLE' && doctor.isAvailable) ||
      (filterStatus === 'UNAVAILABLE' && !doctor.isAvailable);

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getSpecialtyBadgeColor = (specialty: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    const index = specialty.length % colors.length;
    return colors[index];
  };

  const getStatusBadgeColor = (isVerified: boolean, isAvailable: boolean) => {
    if (isVerified && isAvailable) return 'bg-green-100 text-green-800';
    if (isVerified && !isAvailable) return 'bg-yellow-100 text-yellow-800';
    if (!isVerified) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (isVerified: boolean, isAvailable: boolean) => {
    if (isVerified && isAvailable) return 'Active';
    if (isVerified && !isAvailable) return 'Unavailable';
    if (!isVerified) return 'Unverified';
    return 'Unknown';
  };

  // Load specialties from shared service
  const [specialtyOptions, setSpecialtyOptions] = useState<SelectOption[]>([
    { value: 'ALL', label: 'All Specialties' }
  ]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        setLoadingSpecialties(true);
        
        const specialtiesData = await specialtiesApi.getSpecialtiesForSelect();
        
        setSpecialtyOptions([
          { value: 'ALL', label: 'All Specialties' },
          ...specialtiesData
        ]);
      } catch (error) {
        
        // Fallback to doctor specialties if API fails
        const doctorSpecialties = Array.from(new Set(doctors.flatMap(doctor => doctor.specialties.map(s => s.name))));
        
        setSpecialtyOptions([
          { value: 'ALL', label: 'All Specialties' },
          ...doctorSpecialties.map(specialty => ({ value: specialty, label: specialty }))
        ]);
      } finally {
        setLoadingSpecialties(false);
      }
    };

    // Load specialties immediately, don't wait for doctors
    loadSpecialties();
  }, []);
  
  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Status' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'UNVERIFIED', label: 'Unverified' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'UNAVAILABLE', label: 'Unavailable' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <SkeletonStats count={4} />

        {/* Filters Skeleton */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Doctors Grid Skeleton */}
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
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600 mt-2">Manage doctor profiles and specialties</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Doctors</h3>
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
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600 mt-2">
            Manage doctor profiles and specialties
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/admin/doctors/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Doctor</span>
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
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Verified Doctors</p>
              <p className="text-2xl font-bold text-green-600">
                {doctors.filter(d => d.isVerified).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-blue-600">
                {doctors.filter(d => d.isAvailable).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Specialties</p>
              <p className="text-2xl font-bold text-purple-600">
                {Array.from(new Set(doctors.flatMap(doctor => doctor.specialties.map(s => s.name)))).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
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
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Specialty Filter */}
          <div className="lg:w-48">
            <SearchableSelect
              options={specialtyOptions}
              value={filterSpecialty}
              onChange={(value) => setFilterSpecialty(value as string)}
              placeholder="All Specialties"
              searchPlaceholder="Search specialties..."
              loading={loadingSpecialties}
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
        </div>
      </div>

      {/* Doctors Grid - Odoo Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDoctors.map((doctor, index) => {
          // Add null checks and fallbacks
          if (!doctor || !doctor.user) {
            return null;
          }

          const firstName = doctor.user.firstName || 'Unknown';
          const lastName = doctor.user.lastName || 'Doctor';
          const email = doctor.user.email || 'No email';
          const phone = doctor.user.phone || '';
          const specialties = doctor.specialties || [];
          const licenseNumber = doctor.licenseNumber || 'N/A';
          const bio = doctor.bio || '';

          // Debug: Log doctor data to see what we're getting
          console.log('Doctor data:', {
            id: doctor.id,
            specialties: specialties,
            specialtiesLength: specialties.length,
            doctorSpecialties: doctor.doctorSpecialties
          });

          const cardClasses = `rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border ${
            !doctor.isActive
              ? 'bg-red-50 border-red-200'
              : (!doctor.isVerified ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200')
          }`;

          return (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cardClasses}
            >
              {/* Header with Avatar and Name */}
              <div className="p-4 pb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {firstName[0]}{lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      Dr. {firstName} {lastName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-1">{email}</p>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="px-4 pb-3 space-y-3">
                {/* Phone */}
                {phone && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span className="truncate">{phone}</span>
                  </div>
                )}

                {/* Specialties */}
                <div>
                  <div className="flex flex-wrap gap-1">
                    {specialties.length > 0 ? (
                      specialties.slice(0, 2).map((specialty, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {specialty.name}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600">
                        No specialties
                      </span>
                    )}
                    {specialties.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600">
                        +{specialties.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 flex items-center justify-center space-x-1">
                <button 
                  className="text-gray-400 hover:text-blue-600 p-2 rounded transition-colors"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  className="text-gray-400 hover:text-green-600 p-2 rounded transition-colors"
                  title="Edit Doctor"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  className="text-gray-400 hover:text-red-600 p-2 rounded transition-colors"
                  title="Delete Doctor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}

