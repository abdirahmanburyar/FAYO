'use client';

import { useState, useEffect, use, useRef } from 'react';
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
  Trash2,
  Loader2,
  Search
} from 'lucide-react';
import { hospitalApi, Hospital } from '@/services/hospitalApi';
import { hospitalServicesApi, AddServiceRequest, hospitalDoctorsApi, AddDoctorRequest, HospitalDoctor } from '@/services/hospitalManagementApi';
import { SkeletonProfile, SkeletonCard } from '@/components/skeletons';
import ServiceManagementModal from '@/components/hospital/ServiceManagementModal';
import DoctorManagementModal from '@/components/hospital/DoctorManagementModal';
import { API_CONFIG } from '@/config/api';

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hospital) return;

    try {
      setIsUploadingImage(true);
      
      // 1. Upload to hospital-service
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch(`${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/uploads`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      const uploadData = await uploadResponse.json();
      const fullUrl = `${API_CONFIG.HOSPITAL_SERVICE_URL}${uploadData.url}`;

      // 2. Update hospital with new logo URL
      await hospitalApi.updateHospital(hospital.id, { logoUrl: fullUrl });

      // 3. Update local state
      setHospital(prev => prev ? { ...prev, logoUrl: fullUrl } : null);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Service management functions
  const handleAddService = async (data: AddServiceRequest) => {
    try {
      await hospitalServicesApi.addService(resolvedParams.id, data);
      setShowAddServiceModal(false);
      await fetchHospital();
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      await hospitalServicesApi.removeService(resolvedParams.id, serviceId);
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
      await fetchHospital();
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    try {
      await hospitalDoctorsApi.removeDoctor(resolvedParams.id, doctorId);
      await fetchHospital();
    } catch (error) {
      console.error('Error removing doctor:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="col-span-3 h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The hospital you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/admin/hospitals')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Hospitals
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
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500">
          <button onClick={() => router.push('/admin')} className="hover:text-blue-600 transition-colors">Admin</button>
          <span className="mx-2">›</span>
          <button onClick={() => router.push('/admin/hospitals')} className="hover:text-blue-600 transition-colors">Hospitals</button>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium truncate max-w-xs">{hospital.name}</span>
        </nav>

        {/* Modern Header Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover Area */}
          <div className="h-32 bg-gradient-to-r from-teal-600 to-emerald-600 relative">
            <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:20px_20px]"></div>
            <div className="absolute top-4 right-4">
              <button
                onClick={() => router.push(`/admin/hospitals/${hospital.id}/edit`)}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-white/20 transition-all text-sm font-medium shadow-lg"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
              {/* Logo Upload Section */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                  {isUploadingImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                    </div>
                  ) : null}
                  
                  {hospital.logoUrl ? (
                    <img 
                      src={hospital.logoUrl} 
                      alt={hospital.name} 
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="w-16 h-16 text-gray-300" />
                  )}
                  
                  {/* Upload Overlay */}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                    <div className="text-white flex flex-col items-center">
                      <Camera className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium">Change Logo</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
                <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white z-20 ${hospital.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={hospital.isActive ? 'Active' : 'Inactive'}></div>
              </div>

              {/* Hospital Info */}
              <div className="flex-1 pt-2 md:pb-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    hospital.type === 'HOSPITAL' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-purple-50 text-purple-700 border-purple-100'
                  }`}>
                    {hospital.type}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    hospital.isActive 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {hospital.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600 text-sm mt-2">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{hospital.address}, {hospital.city}</span>
                  </div>
                  {hospital.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{hospital.phone}</span>
                    </div>
                  )}
                  {hospital.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{hospital.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Doctors</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{hospitalDoctors.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Services</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{hospital.services?.length || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Booking Policy</p>
                  <p className="text-sm font-bold text-gray-900 mt-2 uppercase">{hospital.bookingPolicy?.replace('_', ' ') || 'Direct'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</p>
                  <p className="text-base font-bold text-gray-900 mt-1">
                    {new Date(hospital.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Menu</h3>
              </div>
              <nav className="p-2 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 font-medium shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span>{tab.name}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600"></div>}
                    </button>
                  );
                })}
              </nav>
              
              {/* Sidebar Contact Info */}
              <div className="p-4 border-t border-gray-100 mt-2">
                <div className="text-xs font-medium text-gray-500 uppercase mb-3">Quick Contact</div>
                <div className="space-y-3">
                  {hospital.phone && (
                    <div className="flex items-center text-sm text-gray-600 group">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-green-50 transition-colors">
                        <Phone className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                      </div>
                      <span>{hospital.phone}</span>
                    </div>
                  )}
                  {hospital.website && (
                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-gray-600 group hover:text-blue-600">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
                        <Globe className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </div>
                      <span className="truncate">{hospital.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-8 space-y-8"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-teal-600" />
                      About {hospital.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-xl border border-gray-100">
                      {hospital.description || `${hospital.name} is a premier ${hospital.type.toLowerCase()} located in ${hospital.city}. We are dedicated to providing exceptional healthcare services to our community with a focus on patient comfort and advanced medical care.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-teal-600" />
                        Key Features
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          Emergency Services Available
                        </li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          Modern Medical Equipment
                        </li>
                        <li className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          Qualified Medical Staff
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-teal-600" />
                        Operating Hours
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monday - Friday</span>
                          <span className="font-medium text-gray-900">24 Hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Saturday</span>
                          <span className="font-medium text-gray-900">24 Hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sunday</span>
                          <span className="font-medium text-gray-900">24 Hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Medical Services</h3>
                    <button
                      onClick={() => setShowAddServiceModal(true)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospital.services && hospital.services.length > 0 ? (
                      hospital.services.map((service, index) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={index} 
                          className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-white group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
                                <Stethoscope className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{service.name || 'Unknown Service'}</h4>
                                <p className="text-xs text-gray-500">Active Service</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveService(service.serviceId)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 pl-13">{service.description}</p>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No services added yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add services to let patients know what you offer</p>
                        <button
                          onClick={() => setShowAddServiceModal(true)}
                          className="mt-4 text-teal-600 font-medium hover:text-teal-700"
                        >
                          + Add First Service
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Doctors Tab */}
              {activeTab === 'doctors' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Assigned Doctors</h3>
                    <button
                      onClick={() => setShowAddDoctorModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Assign Doctor</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {hospitalDoctors && hospitalDoctors.length > 0 ? (
                      hospitalDoctors.map((hospitalDoctor, index) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={index} 
                          className="flex flex-col md:flex-row items-start md:items-center p-5 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-white group"
                        >
                          {/* Doctor Avatar & Basic Info */}
                          <div className="flex items-center flex-1 min-w-0 w-full md:w-auto mb-4 md:mb-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-4 flex-shrink-0 overflow-hidden">
                              {hospitalDoctor.doctor.imageUrl ? (
                                <img src={hospitalDoctor.doctor.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{hospitalDoctor.doctor.user?.firstName?.[0] || 'D'}{hospitalDoctor.doctor.user?.lastName?.[0] || ''}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 text-lg truncate">
                                Dr. {hospitalDoctor.doctor.user?.firstName} {hospitalDoctor.doctor.user?.lastName}
                              </h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                <span className="truncate">{hospitalDoctor.doctor.specialty || 'General Practice'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Badges & Stats */}
                          <div className="flex flex-wrap items-center gap-3 md:mx-4 mb-4 md:mb-0 w-full md:w-auto">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase tracking-wide">
                              {hospitalDoctor.role.replace(/_/g, ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (hospitalDoctor.status === 'ACTIVE' || hospitalDoctor.isActive) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {(hospitalDoctor.status === 'ACTIVE' || hospitalDoctor.isActive) ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Details & Action */}
                          <div className="flex items-center justify-between w-full md:w-auto md:flex-none gap-6">
                            <div className="text-sm text-right">
                              {hospitalDoctor.consultationFee && (
                                <p className="font-bold text-gray-900">${(hospitalDoctor.consultationFee / 100).toFixed(2)}</p>
                              )}
                              {(hospitalDoctor.startTime || hospitalDoctor.endTime) && (
                                <p className="text-xs text-gray-500">{hospitalDoctor.startTime} - {hospitalDoctor.endTime}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveDoctor(hospitalDoctor.doctorId)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Doctor Assignment"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No doctors assigned yet</p>
                        <p className="text-sm text-gray-400 mt-1">Assign doctors to this hospital to manage schedules</p>
                        <button
                          onClick={() => setShowAddDoctorModal(true)}
                          className="mt-4 text-blue-600 font-medium hover:text-blue-700"
                        >
                          + Assign First Doctor
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Placeholder Tabs */}
              {activeTab === 'appointments' && (
                <div className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Appointments Management</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                    View and manage appointments scheduled at this hospital. This feature will connect to the appointment service.
                  </p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-12 text-center">
                  <Settings className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Hospital Settings</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">
                    Configure hospital details, preferences, and notification settings.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ServiceManagementModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onAdd={handleAddService}
        hospitalId={resolvedParams.id}
        hospitalName={hospital.name}
      />

      <DoctorManagementModal
        isOpen={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onAdd={handleAddDoctor}
        hospitalId={resolvedParams.id}
        hospitalName={hospital.name}
      />
    </div>
  );
}
