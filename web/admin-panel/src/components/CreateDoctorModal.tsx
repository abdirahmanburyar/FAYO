'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Shield, 
  DollarSign,
  FileText,
  Save,
  AlertCircle,
  Award,
  BookOpen,
  Globe,
  Users,
  Plus
} from 'lucide-react';
import { usersApi } from '@/services/usersApi';
import { doctorApi } from '@/services/doctorApi';
import { specialtiesApi } from '@/services/specialtiesApi';
import MultiSelect from '@/components/ui/MultiSelect';

interface CreateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DoctorFormData {
  // User Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  
  // Doctor Information - Basic
  specialtyIds: string[];
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  
  // Professional Information
  bio: string;
  education: string;
  certifications: string[]; // Array of certification strings
  languages: string[]; // Array of language strings
  awards: string[]; // Array of award strings
  publications: string[]; // Array of publication strings
  memberships: string[]; // Array of membership strings
  researchInterests: string;
}

// This will be loaded from shared service

export default function CreateDoctorModal({ isOpen, onClose, onSuccess }: CreateDoctorModalProps) {
  const [formData, setFormData] = useState<DoctorFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    specialtyIds: [],
    licenseNumber: '',
    experience: 0,
    consultationFee: 0,
    bio: '',
    education: '',
    certifications: [],
    languages: [],
    awards: [],
    publications: [],
    memberships: [],
    researchInterests: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  
  // Dynamic input states for arrays
  const [certificationInput, setCertificationInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [awardInput, setAwardInput] = useState('');
  const [publicationInput, setPublicationInput] = useState('');
  const [membershipInput, setMembershipInput] = useState('');

  // Load specialties when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSpecialties();
    }
  }, [isOpen]);

  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);
      setError(null);
      const specialtiesData = await specialtiesApi.getSpecialtiesForSelect();
      
      if (!specialtiesData || specialtiesData.length === 0) {
        setError('No specialties found. Please add specialties first via the Specialties management page.');
        setSpecialties([]);
      } else {
        // Convert to the format expected by the component
        setSpecialties(specialtiesData.map(s => ({
          id: s.value,
          name: s.label
        })));
      }
    } catch (error) {
      console.error('Error loading specialties:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load specialties';
      // Error message already includes connection details from specialtiesApi
      if (errorMessage.includes('Cannot connect to')) {
        setError(errorMessage);
      } else {
        setError(`Failed to load specialties: ${errorMessage}`);
      }
      setSpecialties([]);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const specialtyOptions = specialties.map(specialty => ({
    value: specialty.id,
    label: specialty.name
  }));

  // Generate sequential numeric username (0001, 0002, etc.)
  const generateSequentialUsername = async () => {
    try {
      // Get all users to determine next sequential number
      const users = await usersApi.getUsers();
      const numericUsernames = users
        .map(user => user.username)
        .filter(username => username && /^\d+$/.test(username))
        .map(username => parseInt(username!))
        .sort((a, b) => b - a);
      
      const nextNumber = numericUsernames.length > 0 ? numericUsernames[0] + 1 : 1;
      return nextNumber.toString().padStart(4, '0');
    } catch (error) {
      console.error('Error generating username:', error);
      // Fallback to random number if API fails
      return Math.floor(Math.random() * 9999) + 1;
    }
  };

  const handleInputChange = (field: keyof DoctorFormData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddArrayItem = (field: 'certifications' | 'languages' | 'awards' | 'publications' | 'memberships', input: string, setInput: (value: string) => void) => {
    if (input.trim()) {
      handleInputChange(field, [...formData[field], input.trim()]);
      setInput('');
    }
  };

  const handleRemoveArrayItem = (field: 'certifications' | 'languages' | 'awards' | 'publications' | 'memberships', index: number) => {
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    handleInputChange(field, newArray);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }
    
    if (step === 2) {
      setStep(3);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate sequential username
      const sequentialUsername = await generateSequentialUsername();

      // Try to find existing user first, or create new one
      let user;
      try {
        console.log('🔍 [DOCTOR] Starting user lookup/creation process...');
        
        // First try to find existing user by email or phone
        const existingUsers = await usersApi.getUsers();
        console.log('📋 [DOCTOR] Fetched existing users:', existingUsers?.length || 0);
        
        const existingUser = existingUsers.find(u => 
          u.email === formData.email || u.phone === formData.phone
        );
        
        if (existingUser) {
          console.log('✅ [DOCTOR] Using existing user:', {
            id: existingUser.id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            email: existingUser.email
          });
          user = existingUser;
        } else {
          console.log('🆕 [DOCTOR] No existing user found, creating new user...');
          // Create new user if none exists
          const userData = {
            username: sequentialUsername,
            email: formData.email,
            phone: formData.phone,
            password: 'password', // Default password
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: 'DOCTOR' as const,
            userType: 'DOCTOR' as const,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            address: formData.address
          };

          user = await usersApi.createUser(userData);
          console.log('✅ [DOCTOR] New user created:', {
            id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email
          });
        }
      } catch (error) {
        console.error('❌ [DOCTOR] Error handling user creation:', error);
        // If user creation fails due to conflict, try to find the existing user
        if (error.status === 409) {
          console.log('🔄 [DOCTOR] User creation failed due to conflict, searching for existing user...');
          const existingUsers = await usersApi.getUsers();
          const existingUser = existingUsers.find(u => 
            u.email === formData.email || u.phone === formData.phone
          );
          if (existingUser) {
            console.log('✅ [DOCTOR] Found existing user after conflict:', existingUser.id);
            user = existingUser;
          } else {
            console.error('❌ [DOCTOR] No existing user found after conflict');
            throw error;
          }
        } else {
          throw error;
        }
      }

      // Validate that we have a user before proceeding
      if (!user || !user.id) {
        throw new Error('Failed to create or find user. Please try again.');
      }

      console.log('User validated:', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });

      // Create doctor profile
      const doctorData = {
        userId: user.id,
        specialtyIds: formData.specialtyIds,
        licenseNumber: formData.licenseNumber,
        experience: formData.experience,
        isVerified: false, // New doctors start as unverified
        isAvailable: true,
        consultationFee: Math.round(formData.consultationFee * 100), // Convert to cents
        bio: formData.bio || undefined,
        education: formData.education || undefined,
        certifications: formData.certifications.length > 0 ? JSON.stringify(formData.certifications) : undefined,
        languages: formData.languages.length > 0 ? JSON.stringify(formData.languages) : undefined,
        awards: formData.awards.length > 0 ? JSON.stringify(formData.awards) : undefined,
        publications: formData.publications.length > 0 ? JSON.stringify(formData.publications) : undefined,
        memberships: formData.memberships.length > 0 ? JSON.stringify(formData.memberships) : undefined,
        researchInterests: formData.researchInterests || undefined,
      };

      await doctorApi.createDoctor(doctorData);

      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'MALE',
        address: '',
        specialtyIds: [],
        licenseNumber: '',
        experience: 0,
        consultationFee: 0,
        bio: '',
        education: '',
        certifications: [],
        languages: [],
        awards: [],
        publications: [],
        memberships: [],
        researchInterests: ''
      });
      setCertificationInput('');
      setLanguageInput('');
      setAwardInput('');
      setPublicationInput('');
      setMembershipInput('');
      setStep(1);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating doctor:', error);
      setError(error instanceof Error ? error.message : 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Doctor</h2>
              <p className="text-gray-600 mt-1">
                Step {step} of 2: {step === 1 ? 'Personal Information' : 'Professional Information'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="doctor@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+252907700949"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>

                {/* Generated Username Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Username will be generated:</p>
                      <p className="text-lg font-mono text-blue-700">Sequential number (0001, 0002, etc.)</p>
                      <p className="text-xs text-blue-600 mt-1">Default password: password</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Professional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <MultiSelect
                      label="Medical Specialties *"
                      required
                      options={specialtyOptions}
                      value={formData.specialtyIds}
                      onChange={(value) => handleInputChange('specialtyIds', value)}
                      placeholder="Select specialties"
                      searchPlaceholder="Search specialties..."
                      maxSelections={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MD123456"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="50"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consultation Fee (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange('consultationFee', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Bio
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief professional biography and qualifications..."
                    />
                  </div>
                </div>

              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Education & Credentials
                </h3>

                {/* Education */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., MD, Harvard Medical School, 2010"
                  />
                  <p className="text-xs text-gray-500 mt-1">Include degree, institution, and graduation year</p>
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={certificationInput}
                      onChange={(e) => setCertificationInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddArrayItem('certifications', certificationInput, setCertificationInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Board Certified in Cardiology"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem('certifications', certificationInput, setCertificationInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('certifications', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddArrayItem('languages', languageInput, setLanguageInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., English, Spanish, French"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem('languages', languageInput, setLanguageInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('languages', index)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Awards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Awards & Honors
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={awardInput}
                      onChange={(e) => setAwardInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddArrayItem('awards', awardInput, setAwardInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Best Doctor Award 2023"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem('awards', awardInput, setAwardInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.awards.map((award, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        {award}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('awards', index)}
                          className="ml-2 text-yellow-600 hover:text-yellow-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Publications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publications
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={publicationInput}
                      onChange={(e) => setPublicationInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddArrayItem('publications', publicationInput, setPublicationInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Journal of Cardiology, 2023"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem('publications', publicationInput, setPublicationInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.publications.map((pub, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        {pub}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('publications', index)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Professional Memberships */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Memberships
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={membershipInput}
                      onChange={(e) => setMembershipInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddArrayItem('memberships', membershipInput, setMembershipInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., American Medical Association"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem('memberships', membershipInput, setMembershipInput)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.memberships.map((membership, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {membership}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem('memberships', index)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Research Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Interests
                  </label>
                  <textarea
                    value={formData.researchInterests}
                    onChange={(e) => handleInputChange('researchInterests', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe research interests and focus areas..."
                  />
                </div>

              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div>
                {(step === 2 || step === 3) && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {loading ? 'Creating...' : step === 3 ? 'Create Doctor' : 'Next'}
                  </span>
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
