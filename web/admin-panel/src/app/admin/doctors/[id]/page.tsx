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
  TrendingUp
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

  useEffect(() => {
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

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

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
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error || 'Doctor not found'}</p>
          <button
            onClick={() => router.push('/admin/doctors')}
            className="mt-4 text-blue-600 hover:text-blue-800"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/doctors')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dr. {doctor.user?.firstName} {doctor.user?.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              {doctor.specialties?.map(s => s.name).join(', ') || 'No specialties'}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/admin/doctors/${doctorId}/create`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </motion.button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {doctor.user?.firstName} {doctor.user?.lastName}
              </h2>
              {doctor.isVerified && (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
              {doctor.isAvailable ? (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  Unavailable
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span>{doctor.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{doctor.user?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase className="w-4 h-4 mr-2" />
                <span>{doctor.experience} years experience</span>
              </div>
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>${doctor.selfEmployedConsultationFee ? (doctor.selfEmployedConsultationFee / 100).toFixed(2) : '0.00'} self-employed fee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">Overview</h3>

                {/* Bio */}
                {doctor.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Professional Bio</h4>
                    <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
                  </div>
                )}

                {/* Specialties */}
                {doctor.specialties && doctor.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Medical Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specialties.map((specialty) => (
                        <span
                          key={specialty.id}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {specialty.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="text-2xl font-bold text-gray-900">{doctor.experience} years</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">License</p>
                        <p className="text-lg font-semibold text-gray-900">{doctor.licenseNumber}</p>
                      </div>
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Self-Employed Fee</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${doctor.selfEmployedConsultationFee ? (doctor.selfEmployedConsultationFee / 100).toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">Professional Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Number</label>
                    <p className="text-gray-900 mt-1">{doctor.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                    <p className="text-gray-900 mt-1">{doctor.experience} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Self-Employed Consultation Fee</label>
                    <p className="text-gray-900 mt-1">
                      ${doctor.selfEmployedConsultationFee ? (doctor.selfEmployedConsultationFee / 100).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 flex items-center space-x-2">
                      {doctor.isVerified ? (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Verified
                        </span>
                      )}
                      {doctor.isAvailable ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {doctor.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Professional Bio</label>
                    <p className="text-gray-600 mt-1 leading-relaxed">{doctor.bio}</p>
                  </div>
                )}

                {doctor.researchInterests && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Research Interests</label>
                    <p className="text-gray-600 mt-1 leading-relaxed">{doctor.researchInterests}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Education & Credentials Tab */}
            {activeTab === 'education' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">Education & Credentials</h3>

                {/* Education */}
                {doctor.education && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Education
                    </h4>
                    <p className="text-gray-900">{doctor.education}</p>
                  </div>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Certifications
                    </h4>
                    <div className="space-y-2">
                      {certifications.map((cert, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-900">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Languages Spoken
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {awards.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Awards & Honors
                    </h4>
                    <div className="space-y-2">
                      {awards.map((award, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-600" />
                          <span className="text-gray-900">{award}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publications */}
                {publications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Publications
                    </h4>
                    <div className="space-y-2">
                      {publications.map((pub, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <BookOpen className="w-4 h-4 text-purple-600 mt-0.5" />
                          <span className="text-gray-900">{pub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Professional Memberships */}
                {memberships.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Professional Memberships
                    </h4>
                    <div className="space-y-2">
                      {memberships.map((membership, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span className="text-gray-900">{membership}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!doctor.education && certifications.length === 0 && languages.length === 0 && 
                 awards.length === 0 && publications.length === 0 && memberships.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No education or credentials information available</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Hospitals Tab */}
            {activeTab === 'hospitals' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900">Associated Hospitals</h3>
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
        <p className="mt-4 text-gray-500">Loading hospitals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>No hospital associations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hospitals.map((hospitalAssignment: any) => {
        const hospital = hospitalAssignment.hospital || hospitalAssignment;
        const role = hospitalAssignment.role || 'CONSULTANT';
        const shift = hospitalAssignment.shift;
        const startTime = hospitalAssignment.startTime;
        const endTime = hospitalAssignment.endTime;
        const consultationFee = hospitalAssignment.consultationFee;
        const status = hospitalAssignment.status || 'ACTIVE';

        return (
          <div key={hospitalAssignment.id || hospital.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{hospital.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {role.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {hospital.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{hospital.address}</p>
                        {hospital.city && <p className="text-sm text-gray-600">{hospital.city}</p>}
                      </div>
                    </div>
                  )}
                  {hospital.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{hospital.phone}</p>
                    </div>
                  )}
                  {hospital.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{hospital.email}</p>
                    </div>
                  )}
                  {consultationFee && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">${(consultationFee / 100).toFixed(2)} consultation fee</p>
                    </div>
                  )}
                </div>

                {/* Schedule Information */}
                {(shift || startTime || endTime) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Working Schedule</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {shift && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Shift</p>
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {shift.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                      {(startTime || endTime) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Working Hours</p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {startTime || 'N/A'} - {endTime || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
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

