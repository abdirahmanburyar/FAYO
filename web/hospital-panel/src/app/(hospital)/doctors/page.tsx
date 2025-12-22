'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Mail,
  Phone,
  DollarSign,
  AlertCircle,
  Shield,
  Star,
  MapPin,
  Clock,
  Building2
} from 'lucide-react';
import { hospitalDoctorsApi, HospitalDoctor } from '@/services/hospitalManagementApi';
import { doctorApi, Doctor } from '@/services/doctorApi';
import { SkeletonCard } from '@/components/skeletons';
import { getHospitalId } from '@/utils/hospital';
import DoctorManagementModal from '@/components/hospital/DoctorManagementModal';
import { getHospitalData } from '@/utils/hospital';

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<HospitalDoctor | null>(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hospitalId = getHospitalId();
      if (!hospitalId) {
        setError('Hospital ID not found. Please log in again.');
        return;
      }
      
      const doctorsData = await hospitalDoctorsApi.getDoctors(hospitalId);
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    if (!doctor || !doctor.doctor) return false;

    const doctorName = `${doctor.doctor.user?.firstName || ''} ${doctor.doctor.user?.lastName || ''}`.toLowerCase();
    const email = doctor.doctor.user?.email?.toLowerCase() || '';
    const licenseNumber = doctor.doctor.licenseNumber?.toLowerCase() || '';
    const specialty = doctor.doctor.specialty?.toLowerCase() || '';
    const role = doctor.role?.toLowerCase() || '';

    const matchesSearch = searchTerm === '' || 
      doctorName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      licenseNumber.includes(searchTerm.toLowerCase()) ||
      specialty.includes(searchTerm.toLowerCase()) ||
      role.includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && doctor.status === 'ACTIVE') ||
      (filterStatus === 'INACTIVE' && doctor.status !== 'ACTIVE');

    return matchesSearch && matchesStatus;
  });

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setShowAddModal(true);
  };

  const handleEditDoctor = (doctor: HospitalDoctor) => {
    // For now, editing is not supported by the modal
    // You can remove a doctor and add them again with new settings
    alert('To edit a doctor, please remove them and add them again with updated information.');
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to remove this doctor from the hospital?')) return;
    
    try {
      const hospitalId = getHospitalId();
      if (!hospitalId) {
        alert('Hospital ID not found');
        return;
      }
      
      await hospitalDoctorsApi.removeDoctor(hospitalId, doctorId);
      await fetchDoctors();
    } catch (error) {
      console.error('Error removing doctor:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove doctor');
    }
  };

  const handleAddDoctorToHospital = async (data: any) => {
    try {
      const hospitalId = getHospitalId();
      if (!hospitalId) {
        alert('Hospital ID not found');
        return;
      }
      
      await hospitalDoctorsApi.addDoctor(hospitalId, data);
      await fetchDoctors();
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingDoctor(null);
    fetchDoctors();
  };

  const formatFee = (fee?: number) => {
    if (!fee) return 'N/A';
    // Fee is stored in cents in the database, but API returns in dollars
    return `$${fee.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'HEAD_OF_DEPARTMENT':
        return 'bg-purple-100 text-purple-800';
      case 'SENIOR_CONSULTANT':
        return 'bg-blue-100 text-blue-800';
      case 'CONSULTANT':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600 mt-2">Manage doctors in your hospital</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600 mt-2">Manage doctors in your hospital</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Doctors</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchDoctors}
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
          <p className="text-gray-600 mt-2">Manage doctors in your hospital</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddDoctor}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Doctor</span>
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
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
            <Stethoscope className="w-8 h-8 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {doctors.filter(d => d.status === 'ACTIVE').length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">
                {doctors.filter(d => d.status !== 'ACTIVE').length}
              </p>
            </div>
            <UserX className="w-8 h-8 text-gray-600" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'ALL' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first doctor to the hospital.'}
          </p>
          {!searchTerm && filterStatus === 'ALL' && (
            <button
              onClick={handleAddDoctor}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Doctor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {doctor.doctor?.user?.firstName} {doctor.doctor?.user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {doctor.doctor?.specialty || 'General Practice'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditDoctor(doctor)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doctor.doctorId)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(doctor.status)}`}>
                    {doctor.status || 'UNKNOWN'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(doctor.role)}`}>
                    {doctor.role?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {doctor.doctor?.user?.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{doctor.doctor.user.email}</span>
                    </div>
                  )}
                  {doctor.doctor?.user?.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{doctor.doctor.user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Shield className="w-4 h-4 mr-2 text-gray-400" />
                    <span>License: {doctor.doctor?.licenseNumber || 'N/A'}</span>
                  </div>
                  {doctor.consultationFee && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Fee: {formatFee(doctor.consultationFee)}</span>
                    </div>
                  )}
                  {doctor.startTime && doctor.endTime && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{doctor.startTime} - {doctor.endTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (() => {
        const hospitalId = getHospitalId();
        const hospitalData = getHospitalData();
        if (!hospitalId || !hospitalData) return null;
        
        return (
          <DoctorManagementModal
            isOpen={showAddModal}
            onClose={handleModalClose}
            onAdd={handleAddDoctorToHospital}
            hospitalId={hospitalId}
            hospitalName={hospitalData.name}
          />
        );
      })()}
    </div>
  );
}

