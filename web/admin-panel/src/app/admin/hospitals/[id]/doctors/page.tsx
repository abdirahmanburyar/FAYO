'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  Shield,
  Star,
  Phone,
  Mail,
  Calendar,
  Award
} from 'lucide-react';
import { hospitalApi, Hospital } from '@/services/hospitalApi';
import { doctorApi, Doctor } from '@/services/doctorApi';
import { hospitalDoctorsApi, AddDoctorRequest } from '@/services/hospitalManagementApi';
import { SkeletonCard, SkeletonList } from '@/components/skeletons';
import { SearchableSelect, SelectOption } from '@/components/ui';
import DoctorManagementModal from '@/components/hospital/DoctorManagementModal';

interface HospitalDoctorsProps {
  params: {
    id: string;
  };
}

interface HospitalDoctor {
  id: string;
  doctorId: string;
  hospitalId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  leftAt?: string;
  doctor: Doctor;
}

export default function HospitalDoctorsPage({ params }: HospitalDoctorsProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitalDoctors, setHospitalDoctors] = useState<HospitalDoctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<HospitalDoctor | null>(null);

  // Fetch hospital and doctors
  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hospitalData, doctorsData] = await Promise.all([
        hospitalApi.getHospitalById(resolvedParams.id),
        doctorApi.getDoctors()
      ]);
      setHospital(hospitalData);
      setAllDoctors(doctorsData);
      
      // TODO: Replace with actual hospital doctors API call
      // For now, we'll simulate hospital doctors data
      const simulatedHospitalDoctors: HospitalDoctor[] = doctorsData.slice(0, 5).map((doctor, index) => ({
        id: `hd-${index}`,
        doctorId: doctor.id,
        hospitalId: resolvedParams.id,
        departmentId: index % 2 === 0 ? 'cardiology' : 'neurology',
        departmentName: index % 2 === 0 ? 'Cardiology' : 'Neurology',
        role: index === 0 ? 'HEAD_OF_DEPARTMENT' : 'CONSULTANT',
        isActive: true,
        joinedAt: new Date().toISOString(),
        doctor
      }));
      setHospitalDoctors(simulatedHospitalDoctors);
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch hospital data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, [resolvedParams.id]);

  const filteredDoctors = hospitalDoctors.filter(hospitalDoctor => {
    const doctor = hospitalDoctor.doctor;
    const matchesSearch = 
      doctor.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospitalDoctor.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && hospitalDoctor.isActive) ||
      (filterStatus === 'INACTIVE' && !hospitalDoctor.isActive) ||
      (filterStatus === 'VERIFIED' && doctor.isVerified) ||
      (filterStatus === 'UNVERIFIED' && !doctor.isVerified);

    const matchesDepartment = filterDepartment === 'ALL' || 
      hospitalDoctor.departmentId === filterDepartment;

    const matchesRole = filterRole === 'ALL' || 
      hospitalDoctor.role === filterRole;

    return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
  });

  const handleAddDoctor = async (data: AddDoctorRequest) => {
    try {
      await hospitalDoctorsApi.addDoctor(resolvedParams.id, data);
      setShowAddModal(false);
      // Refresh data after adding
      await fetchHospitalData();
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    try {
      // TODO: Implement API call to remove doctor from hospital
      console.log('Removing doctor:', doctorId, 'from hospital:', resolvedParams.id);
      // Refresh data after removing
      await fetchHospitalData();
    } catch (error) {
      console.error('Error removing doctor:', error);
    }
  };

  const handleToggleDoctorStatus = async (doctorId: string, isActive: boolean) => {
    try {
      // TODO: Implement API call to toggle doctor status
      console.log('Toggling doctor status:', doctorId, 'to:', isActive);
      // Refresh data after updating
      await fetchHospitalData();
    } catch (error) {
      console.error('Error toggling doctor status:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'HEAD_OF_DEPARTMENT': 'bg-purple-100 text-purple-800',
      'CONSULTANT': 'bg-blue-100 text-blue-800',
      'SENIOR_CONSULTANT': 'bg-indigo-100 text-indigo-800',
      'RESIDENT': 'bg-green-100 text-green-800',
      'INTERN': 'bg-yellow-100 text-yellow-800',
      'GENERAL_PRACTITIONER': 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplayName = (role: string) => {
    const names: { [key: string]: string } = {
      'HEAD_OF_DEPARTMENT': 'Head of Department',
      'CONSULTANT': 'Consultant',
      'SENIOR_CONSULTANT': 'Senior Consultant',
      'RESIDENT': 'Resident',
      'INTERN': 'Intern',
      'GENERAL_PRACTITIONER': 'General Practitioner',
    };
    return names[role] || role;
  };

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'UNVERIFIED', label: 'Unverified' }
  ];

  const roleOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'HEAD_OF_DEPARTMENT', label: 'Head of Department' },
    { value: 'CONSULTANT', label: 'Consultant' },
    { value: 'SENIOR_CONSULTANT', label: 'Senior Consultant' },
    { value: 'RESIDENT', label: 'Resident' },
    { value: 'INTERN', label: 'Intern' },
    { value: 'GENERAL_PRACTITIONER', label: 'General Practitioner' }
  ];

  // Get unique departments for filter
  const departments = Array.from(new Set(hospitalDoctors.map(hd => hd.departmentId).filter(Boolean)));
  const departmentOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Departments' },
    ...departments.map(deptId => {
      const hospitalDoctor = hospitalDoctors.find(hd => hd.departmentId === deptId);
      return { value: deptId, label: hospitalDoctor?.departmentName || deptId };
    })
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <SkeletonCard height="h-24" />
            <SkeletonList count={6} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Hospital</h2>
          <p className="text-gray-600 mb-4">{error || 'The hospital you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
                <p className="text-gray-600">{hospital.name}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Doctor</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
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
                  <p className="text-2xl font-bold text-gray-900">{hospitalDoctors.length}</p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-600" />
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
                  <p className="text-sm font-medium text-gray-600">Active Doctors</p>
                  <p className="text-2xl font-bold text-green-600">
                    {hospitalDoctors.filter(hd => hd.isActive).length}
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
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {hospitalDoctors.filter(hd => hd.doctor.isVerified).length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
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
                  <p className="text-sm font-medium text-gray-600">Departments</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {departments.length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
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

              {/* Department Filter */}
              <div className="lg:w-48">
                <SearchableSelect
                  options={departmentOptions}
                  value={filterDepartment}
                  onChange={(value) => setFilterDepartment(value as string)}
                  placeholder="All Departments"
                  searchPlaceholder="Search departments..."
                  allowClear={false}
                />
              </div>

              {/* Role Filter */}
              <div className="lg:w-48">
                <SearchableSelect
                  options={roleOptions}
                  value={filterRole}
                  onChange={(value) => setFilterRole(value as string)}
                  placeholder="All Roles"
                  searchPlaceholder="Search roles..."
                  allowClear={false}
                />
              </div>
            </div>
          </div>

          {/* Doctors List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Doctors</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredDoctors.map((hospitalDoctor, index) => (
                <motion.div
                  key={hospitalDoctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {hospitalDoctor.doctor.user.firstName?.[0]}{hospitalDoctor.doctor.user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Dr. {hospitalDoctor.doctor.user.firstName} {hospitalDoctor.doctor.user.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{hospitalDoctor.doctor.user.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-600">
                            {hospitalDoctor.doctor.specialty}
                          </span>
                          {hospitalDoctor.departmentName && (
                            <span className="text-sm text-gray-600">
                              {hospitalDoctor.departmentName}
                            </span>
                          )}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(hospitalDoctor.role)}`}>
                            {getRoleDisplayName(hospitalDoctor.role)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            hospitalDoctor.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {hospitalDoctor.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {hospitalDoctor.doctor.isVerified && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          {hospitalDoctor.doctor.user.phone && (
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {hospitalDoctor.doctor.user.phone}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Joined {new Date(hospitalDoctor.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedDoctor(hospitalDoctor)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Doctor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleDoctorStatus(hospitalDoctor.doctorId, !hospitalDoctor.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          hospitalDoctor.isActive
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={hospitalDoctor.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {hospitalDoctor.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRemoveDoctor(hospitalDoctor.doctorId)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      <DoctorManagementModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDoctor}
        hospitalId={resolvedParams.id}
        hospitalName={hospital?.name || ''}
      />
    </div>
  );
}
