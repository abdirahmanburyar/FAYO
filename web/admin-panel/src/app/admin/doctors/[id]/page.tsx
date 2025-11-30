'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  User,
  GraduationCap,
  Award,
  BookOpen,
  Globe,
  Users,
  Calendar,
  FileText,
  Mail,
  Phone,
  MapPin,
  Shield,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Edit,
  Building2,
  Search,
  Clock,
  Briefcase,
  TrendingUp,
  Stethoscope,
  Camera,
  Loader2
} from 'lucide-react';
import { doctorApi, Doctor } from '@/services/doctorApi';
import { SkeletonCard } from '@/components/skeletons';
import { API_CONFIG } from '@/config/api';

type ActiveTab = 'overview' | 'professional' | 'education' | 'hospitals';

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      setError(null);
      const doctorData = await doctorApi.getDoctorById(doctorId);
      setDoctor(doctorData);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch doctor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doctor) return;

    try {
      setUploadingImage(true);
      
      // 1. Upload to doctor-service
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch(`${API_CONFIG.DOCTOR_SERVICE_URL}/api/v1/uploads`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      const uploadData = await uploadResponse.json();
      const fullUrl = `${API_CONFIG.DOCTOR_SERVICE_URL}${uploadData.url}`;

      // 2. Update doctor profile with new image URL
      await doctorApi.updateDoctor(doctor.id, { imageUrl: fullUrl });

      // 3. Refresh doctor data (or just update local state)
      setDoctor(prev => prev ? { ...prev, imageUrl: fullUrl } : null);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const parseJsonField = (field: string | undefined): string[] => {
    if (!field) return [];
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  const tabs = [
    { id: 'overview' as ActiveTab, name: 'Overview', icon: User },
    { id: 'professional' as ActiveTab, name: 'Professional', icon: Briefcase },
    { id: 'education' as ActiveTab, name: 'Education & Credentials', icon: GraduationCap },
    { id: 'hospitals' as ActiveTab, name: 'Hospitals', icon: Building2 },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="col-span-3 h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center py-12">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Doctor Not Found</h3>
          <p className="text-red-700 text-center max-w-md mb-6">{error || 'The requested doctor profile could not be found.'}</p>
          <button
            onClick={() => router.push('/admin/doctors')}
            className="px-6 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            ← Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  const certifications = parseJsonField(doctor.certifications as any);
  const languages = parseJsonField(doctor.languages as any);
  const awards = parseJsonField(doctor.awards as any);
  const publications = parseJsonField(doctor.publications as any);
  const memberships = parseJsonField(doctor.memberships as any);

  // Safe name display logic
  const firstName = doctor.user?.firstName;
  const lastName = doctor.user?.lastName;
  const displayName = firstName && lastName 
    ? `Dr. ${firstName} ${lastName}` 
    : firstName 
      ? `Dr. ${firstName}` 
      : `Dr. (ID: ${doctor.id.substring(0, 8)})`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <button onClick={() => router.push('/admin')} className="hover:text-blue-600 transition-colors">Admin</button>
        <span className="mx-2">›</span>
        <button onClick={() => router.push('/admin/doctors')} className="hover:text-blue-600 transition-colors">Doctors</button>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{displayName}</span>
      </nav>

      {/* Profile Header - Modern Design */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Area with Gradient */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:20px_20px]"></div>
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/admin/doctors/${doctorId}/create`)}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-white/20 transition-all text-sm font-medium shadow-lg"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </motion.button>
          </div>
        </div>

        {/* Profile Info Area */}
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
            {/* Portrait Image with Upload - Large and Professional */}
            <div className="relative group">
              <div className="w-48 h-64 rounded-2xl border-4 border-white shadow-2xl bg-white overflow-hidden flex-shrink-0 relative">
                {uploadingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                ) : null}
                
                {doctor.imageUrl ? (
                  <img 
                    src={doctor.imageUrl} 
                    alt={displayName} 
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white text-7xl font-bold">
                      {firstName?.[0] || 'D'}{lastName?.[0] || ''}
                    </span>
                  </div>
                )}
                
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                  <div className="text-white flex flex-col items-center">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-sm font-semibold">Change Photo</span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {/* Status Indicator */}
              <div className={`absolute bottom-4 right-4 w-6 h-6 rounded-full border-4 border-white shadow-lg z-20 ${doctor.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} title={doctor.isAvailable ? 'Available' : 'Unavailable'}></div>
            </div>

            {/* Name & Badges */}
            <div className="flex-1 pt-2 md:pb-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                {doctor.isVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${doctor.isAvailable ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${doctor.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  {doctor.isAvailable ? 'Available for Booking' : 'Unavailable'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600 text-sm mt-2">
                {doctor.specialties && doctor.specialties.length > 0 ? (
                  <div className="flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium text-gray-900">{doctor.specialties[0].name}</span>
                    {doctor.specialties.length > 1 && <span className="text-gray-500 ml-1">+{doctor.specialties.length - 1} more</span>}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2 text-gray-400" />
                    <span>General Practitioner</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{doctor.experience} Years Experience</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{doctor.user?.address || 'Location not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultation Fee</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {doctor.selfEmployedConsultationFee 
                    ? `$${(doctor.selfEmployedConsultationFee / 100).toFixed(2)}` 
                    : <span className="text-gray-400 text-base font-normal">Not set</span>}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">License</p>
                <p className="text-xl font-bold text-gray-900 mt-1 truncate max-w-[120px]" title={doctor.licenseNumber}>
                  {doctor.licenseNumber}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hospitals</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  -- {/* This would need fetching count */}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {new Date(doctor.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Calendar className="w-5 h-5" />
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
              <h3 className="font-semibold text-gray-900">Profile Sections</h3>
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
                        ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{tab.name}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                  </button>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-100 mt-2">
              <div className="text-xs font-medium text-gray-500 uppercase mb-3">Contact Info</div>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
                    <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <span className="truncate" title={doctor.user?.email || 'N/A'}>{doctor.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 group cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-green-50 transition-colors">
                    <Phone className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                  </div>
                  <span>{doctor.user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 space-y-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Professional Overview</h2>
                </div>

                {/* Bio */}
                <div className="prose max-w-none">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">About</h3>
                  {doctor.bio ? (
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-xl border border-gray-100">
                      {doctor.bio}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No professional biography available.</p>
                  )}
                </div>

                {/* Specialties */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Specializations</h3>
                  {doctor.specialties && doctor.specialties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {doctor.specialties.map((specialty) => (
                        <div key={specialty.id} className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{specialty.name}</p>
                            {specialty.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{specialty.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No specialties listed.</p>
                  )}
                </div>

                {/* Research Interests */}
                {doctor.researchInterests && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Research & Focus</h3>
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                      <div className="flex items-start">
                        <Search className="w-5 h-5 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                        <p className="text-indigo-900 leading-relaxed">{doctor.researchInterests}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 space-y-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-gray-500 mr-2" />
                        <h4 className="text-sm font-semibold text-gray-900">License Information</h4>
                      </div>
                      <div className="ml-7">
                        <p className="text-lg font-mono text-gray-800 bg-white inline-block px-3 py-1 rounded border border-gray-200">{doctor.licenseNumber}</p>
                        <p className="text-xs text-gray-500 mt-2">Status: <span className="text-green-600 font-medium">Active</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <div className="flex items-center mb-2">
                        <Briefcase className="w-5 h-5 text-gray-500 mr-2" />
                        <h4 className="text-sm font-semibold text-gray-900">Experience</h4>
                      </div>
                      <div className="ml-7">
                        <p className="text-2xl font-bold text-gray-900">{doctor.experience} <span className="text-sm font-normal text-gray-500">Years</span></p>
                        <p className="text-xs text-gray-500 mt-1">Practicing since {new Date().getFullYear() - doctor.experience}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {memberships.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Professional Memberships</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {memberships.map((membership, index) => (
                        <div key={index} className="flex items-center p-4 bg-white border border-gray-200 rounded-lg">
                          <Users className="w-5 h-5 text-indigo-600 mr-3" />
                          <span className="text-gray-800 font-medium">{membership}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Education & Credentials Tab */}
            {activeTab === 'education' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 space-y-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Education & Credentials</h2>

                <div className="space-y-8">
                  {/* Education */}
                  <section>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    </div>
                    {doctor.education ? (
                      <div className="ml-11 p-4 bg-gray-50 rounded-xl border border-gray-100 border-l-4 border-l-blue-500">
                        <p className="text-gray-900 font-medium text-lg">{doctor.education}</p>
                      </div>
                    ) : (
                      <p className="ml-11 text-gray-400 italic">No education listed</p>
                    )}
                  </section>

                  {/* Certifications */}
                  <section>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Award className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
                    </div>
                    {certifications.length > 0 ? (
                      <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {certifications.map((cert, index) => (
                          <div key={index} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-800">{cert}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-11 text-gray-400 italic">No certifications listed</p>
                    )}
                  </section>

                  {/* Awards */}
                  <section>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <Star className="w-4 h-4 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Awards & Honors</h3>
                    </div>
                    {awards.length > 0 ? (
                      <div className="ml-11 space-y-3">
                        {awards.map((award, index) => (
                          <div key={index} className="flex items-start p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                            <Award className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-800 font-medium">{award}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-11 text-gray-400 italic">No awards listed</p>
                    )}
                  </section>

                  {/* Publications */}
                  <section>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Publications</h3>
                    </div>
                    {publications.length > 0 ? (
                      <div className="ml-11 space-y-3">
                        {publications.map((pub, index) => (
                          <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-200 transition-colors">
                            <div className="flex items-start">
                              <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-800 leading-relaxed">{pub}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-11 text-gray-400 italic">No publications listed</p>
                    )}
                  </section>
                </div>
              </motion.div>
            )}

            {/* Hospitals Tab */}
            {activeTab === 'hospitals' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Hospital Affiliations</h2>
                <DoctorHospitalsTab doctorId={doctorId} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Doctor Hospitals Tab Component
function DoctorHospitalsTab({ doctorId }: { doctorId: string }) {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setError(null);
        // Always include /api/v1 in the path
        const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}/api/v1/hospitals/doctors/${doctorId}/hospitals`;
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('adminToken') && { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch hospitals: ${response.statusText}`);
        }

        const hospitalsData = await response.json();
        setHospitals(hospitalsData || []);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch hospitals');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading hospital affiliations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">No Hospital Affiliations</h3>
        <p className="text-gray-500 mt-1">This doctor is not currently associated with any hospitals.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {hospitals.map((hospitalAssignment: any) => {
        const hospital = hospitalAssignment.hospital || hospitalAssignment;
        const role = hospitalAssignment.role || 'CONSULTANT';
        const shift = hospitalAssignment.shift;
        const startTime = hospitalAssignment.startTime;
        const endTime = hospitalAssignment.endTime;
        const consultationFee = hospitalAssignment.consultationFee;
        const status = hospitalAssignment.status || 'ACTIVE';

        return (
          <div key={hospitalAssignment.id || hospital.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{hospital.name}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                    status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <span className="inline-flex px-3 py-1 text-xs font-bold tracking-wide uppercase bg-gray-100 text-gray-600 rounded-full">
                {role.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {hospital.address && (
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{hospital.address}{hospital.city && `, ${hospital.city}`}</span>
                </div>
              )}
              
              {/* Fees & Schedule */}
              <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                {consultationFee && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Consultation Fee</p>
                    <p className="font-bold text-gray-900">${(consultationFee / 100).toFixed(2)}</p>
                  </div>
                )}
                {(startTime || endTime) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hours</p>
                    <p className="font-medium text-gray-900">{startTime || '--'} - {endTime || '--'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
