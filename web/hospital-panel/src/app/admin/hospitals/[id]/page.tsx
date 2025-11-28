'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star,
  Clock,
  Users,
  Calendar,
  MessageCircle,
  Heart,
  Share2,
  MoreVertical,
  Edit,
  Camera,
  Plus,
  CheckCircle,
  AlertCircle,
  Award,
  Stethoscope,
  Shield,
  Activity,
  UserCheck,
  Settings,
  Trash2
} from 'lucide-react';
import { hospitalApi, Hospital } from '@/services/hospitalApi';
import { hospitalServicesApi, AddServiceRequest, hospitalDoctorsApi, AddDoctorRequest, HospitalDoctor } from '@/services/hospitalManagementApi';
import { SkeletonProfile, SkeletonCard } from '@/components/skeletons';
import ServiceManagementModal from '@/components/hospital/ServiceManagementModal';
import DoctorManagementModal from '@/components/hospital/DoctorManagementModal';

interface HospitalProfileProps {
  params: Promise<{
    id: string;
  }>;
}

export default function HospitalProfilePage({ params }: HospitalProfileProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [hospitalDoctors, setHospitalDoctors] = useState<HospitalDoctor[]>([]);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hospitalData, doctorsData] = await Promise.all([
        hospitalApi.getHospitalById(resolvedParams.id),
        hospitalDoctorsApi.getDoctors(resolvedParams.id)
      ]);
      setHospital(hospitalData);
      setHospitalDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch hospital');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
  }, [resolvedParams.id]);

  // Service management functions
  const handleAddService = async (data: AddServiceRequest) => {
    try {
      await hospitalServicesApi.addService(resolvedParams.id, data);
      setShowAddServiceModal(false);
      // Refresh hospital data
      await fetchHospital();
    } catch (error) {
      console.error('Error adding service:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      await hospitalServicesApi.removeService(resolvedParams.id, serviceId);
      // Refresh hospital data
      await fetchHospital();
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  // Doctor management functions
  const handleAddDoctor = async (data: AddDoctorRequest) => {
    try {
      await hospitalDoctorsApi.addDoctor(resolvedParams.id, data);
      setShowAddDoctorModal(false);
      // Refresh hospital data
      await fetchHospital();
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    try {
      await hospitalDoctorsApi.removeDoctor(resolvedParams.id, doctorId);
      // Refresh hospital data
      await fetchHospital();
    } catch (error) {
      console.error('Error removing doctor:', error);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <SkeletonProfile />
              <SkeletonCard height="h-48" />
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs Skeleton */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
                <div className="flex space-x-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mt-6"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Not Found</h2>
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'services', name: 'Services', icon: Stethoscope },
    { id: 'doctors', name: 'Doctors', icon: UserCheck },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full">
        {/* Profile Section */}
        <div className="bg-white overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 pb-0">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <Building2 className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    hospital.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {hospital.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{hospital.address}, {hospital.city}</span>
                  </div>
                  {hospital.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{hospital.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-6">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24</div>
                  <div className="text-sm text-gray-600">Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">Beds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">4.8</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-white p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">About {hospital.name}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {hospital.name} is a leading healthcare facility in {hospital.city}, providing comprehensive 
                medical services to the community. We are committed to delivering high-quality healthcare 
                with state-of-the-art facilities and experienced medical professionals.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Facilities</h4>
                  <ul className="space-y-2">
                    {['Emergency Department', 'ICU', 'Operating Theaters', 'Laboratory', 'Radiology', 'Pharmacy'].map((facility) => (
                      <li key={facility} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">{facility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h4>
                  <ul className="space-y-2">
                    {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'General Surgery'].map((specialty) => (
                      <li key={specialty} className="flex items-center space-x-2">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">{specialty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Service Management Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Medical Services</h3>
                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Service</span>
                  </button>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hospital.services && hospital.services.length > 0 ? (
                    hospital.services.map((service, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Stethoscope className="w-6 h-6 text-green-600" />
                            <h4 className="font-semibold text-gray-900">{service.name || 'Unknown Service'}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRemoveService(service.serviceId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remove Service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {service.description && (
                            <p className="text-sm text-gray-600">{service.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No services assigned yet</p>
                      <button
                        onClick={() => setShowAddServiceModal(true)}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add First Service
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="space-y-6">
              {/* Doctor Management Header */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Our Doctors</h3>
                  <button
                    onClick={() => setShowAddDoctorModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Doctor</span>
                  </button>
                </div>

                {/* Doctors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hospitalDoctors && hospitalDoctors.length > 0 ? (
                    hospitalDoctors.map((hospitalDoctor, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-green-100 via-blue-50 to-purple-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {hospitalDoctor.doctor.user?.firstName?.[0] || 'D'}{hospitalDoctor.doctor.user?.lastName?.[0] || 'R'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Dr. {hospitalDoctor.doctor.user?.firstName || ''} {hospitalDoctor.doctor.user?.lastName || 'Unknown'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {hospitalDoctor.doctor.specialties?.map((s: any) => s.name).join(', ') || hospitalDoctor.doctor.specialty || 'General'}
                              </p>
                              <p className="text-xs text-gray-400">{hospitalDoctor.role.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRemoveDoctor(hospitalDoctor.doctorId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remove Doctor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Experience:</span>
                            <span className="font-medium">{hospitalDoctor.doctor.experience} years</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">License:</span>
                            <span className="font-medium text-xs">{hospitalDoctor.doctor.licenseNumber}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (hospitalDoctor.status === 'ACTIVE' || hospitalDoctor.isActive) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {(hospitalDoctor.status === 'ACTIVE' || hospitalDoctor.isActive) ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {hospitalDoctor.shift && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Shift:</span>
                              <span className="font-medium">{hospitalDoctor.shift.replace(/_/g, ' ')}</span>
                            </div>
                          )}
                          {(hospitalDoctor.startTime || hospitalDoctor.endTime) && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Hours:</span>
                              <span className="font-medium">
                                {hospitalDoctor.startTime || 'N/A'} - {hospitalDoctor.endTime || 'N/A'}
                              </span>
                            </div>
                          )}
                          {hospitalDoctor.consultationFee && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Fee:</span>
                              <span className="font-medium">${(hospitalDoctor.consultationFee / 100).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No doctors assigned yet</p>
                      <button
                        onClick={() => setShowAddDoctorModal(true)}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add First Doctor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-white p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Appointments</h3>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Appointment management will be available here</p>
                <p className="text-sm text-gray-400">This will be connected to the appointment service</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hospital Settings</h3>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Hospital settings and configuration</p>
                <p className="text-sm text-gray-400">Manage hospital preferences and configurations</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      <ServiceManagementModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onAdd={handleAddService}
        hospitalId={resolvedParams.id}
        hospitalName={hospital?.name || ''}
      />

      {/* Add Doctor Modal */}
      <DoctorManagementModal
        isOpen={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onAdd={handleAddDoctor}
        hospitalId={resolvedParams.id}
        hospitalName={hospital?.name || ''}
      />
    </div>
  );
}
