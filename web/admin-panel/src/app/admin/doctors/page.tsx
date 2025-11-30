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
    // Add null checks for doctor properties
    if (!doctor) {
      return false;
    }

    const doctorSpecialtyNames = (doctor.specialties || []).map(s => s.name).join(' ');
    const firstName = doctor.user?.firstName || '';
    const lastName = doctor.user?.lastName || '';
    const email = doctor.user?.email || '';
    const licenseNumber = doctor.licenseNumber || '';

    const matchesSearch = 
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorSpecialtyNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
      licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Load specialties from doctor-service
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
        console.error('Error loading specialties:', error);
        // Fallback to doctor specialties if API fails
        const doctorSpecialties = Array.from(new Set(doctors.flatMap(doctor => doctor.specialties?.map(s => s.name) || [])));
        
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
  }, [doctors]);
  
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

      {/* Doctors Grid - Portrait Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDoctors.map((doctor, index) => {
          if (!doctor) {
            return null;
          }

          const firstName = doctor.user?.firstName || 'Unknown';
          const lastName = doctor.user?.lastName || 'Doctor';
          const email = doctor.user?.email || 'No email';
          const phone = doctor.user?.phone || '';
          const specialties = doctor.specialties || [];
          const licenseNumber = doctor.licenseNumber || 'N/A';
          const imageUrl = doctor.imageUrl;

          const cardClasses = `rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border-2 ${
            !doctor.isActive
              ? 'bg-red-50 border-red-200'
              : (!doctor.isVerified ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200 hover:border-blue-300')
          }`;

          return (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cardClasses}
            >
              <div className="flex h-full">
                {/* Portrait Image Section - Sidebar */}
                <div className="relative w-40 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={`Dr. ${firstName} ${lastName}`}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        // Fallback to gradient background if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                      <span className="text-white text-5xl font-bold">
                        {firstName[0] || 'D'}{lastName[0] || ''}
                      </span>
                    </div>
                  )}
                  {/* Status Badge Overlay */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg ${
                      doctor.isVerified && doctor.isAvailable 
                        ? 'bg-green-500 text-white' 
                        : doctor.isVerified 
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                    }`}>
                      {doctor.isVerified && doctor.isAvailable ? 'Active' : doctor.isVerified ? 'Unavailable' : 'Unverified'}
                    </span>
                  </div>
                  {/* Hover Overlay for Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                    <button 
                      onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
                      className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => router.push(`/admin/doctors/${doctor.id}/create`)}
                      className="bg-white text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors shadow-lg"
                      title="Edit Doctor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        const doctorName = doctor.user ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'this doctor';
                        if (confirm(`Are you sure you want to delete ${doctorName}? This action cannot be undone.`)) {
                          try {
                            await doctorApi.deleteDoctor(doctor.id);
                            fetchDoctors();
                          } catch (error) {
                            alert(error instanceof Error ? error.message : 'Failed to delete doctor');
                          }
                        }
                      }}
                      className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                      title="Delete Doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Doctor Info Section - Sidebar */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div className="space-y-2">
                    {/* Name and Title */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {firstName !== 'Unknown' ? `Dr. ${firstName} ${lastName}` : `Dr. (ID: ${doctor.userId?.substring(0, 8) || 'Unknown'})`}
                      </h3>
                      {specialties.length > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {specialties[0].name}
                          {specialties.length > 1 && ` +${specialties.length - 1} more`}
                        </p>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      {email && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Specialties Tags */}
                    {specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {specialties.slice(0, 2).map((specialty, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {specialty.name}
                          </span>
                        ))}
                        {specialties.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                            +{specialties.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* License Number - Bottom */}
                  <div className="pt-2 border-t border-gray-100 mt-auto">
                    <p className="text-xs text-gray-500">
                      License: <span className="font-mono font-semibold text-gray-700">{licenseNumber}</span>
                    </p>
                  </div>
                </div>
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

