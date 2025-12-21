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
  AlertCircle
} from 'lucide-react';
import { doctorApi, Doctor, UpdateDoctorDto } from '@/services/doctorApi';
import { specialtiesApi } from '@/services/specialtiesApi';
import MultiSelect from '@/components/ui/MultiSelect';

interface EditDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctor: Doctor | null;
}

export default function EditDoctorModal({ isOpen, onClose, onSuccess, doctor }: EditDoctorModalProps) {
  const [formData, setFormData] = useState({
    specialtyIds: [] as string[],
    licenseNumber: '',
    experience: 0,
    bio: '',
    consultationFee: 0,
    isVerified: false,
    isAvailable: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  // Load doctor data and specialties when modal opens
  useEffect(() => {
    if (isOpen && doctor) {
      // Load specialties first
      loadSpecialties();
      
      // Populate form with doctor data
      // Note: doctor.specialties is an array of specialty objects with id property
      const specialtyIds = doctor.specialties?.map(s => {
        // Handle both cases: specialty object with id, or just id string
        return typeof s === 'string' ? s : (s.id || s);
      }).filter(Boolean) || [];
      
      setFormData({
        specialtyIds: specialtyIds,
        licenseNumber: doctor.licenseNumber || '',
        experience: doctor.experience || 0,
        bio: doctor.bio || '',
        consultationFee: doctor.consultationFee ? doctor.consultationFee / 100 : 0, // Convert from cents
        isVerified: doctor.isVerified || false,
        isAvailable: doctor.isAvailable ?? true,
      });
      setError(null);
    }
  }, [isOpen, doctor]);

  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);
      setError(null);
      const specialtiesData = await specialtiesApi.getSpecialtiesForSelect();
      
      if (!specialtiesData || specialtiesData.length === 0) {
        setError('No specialties found. Please add specialties first via the Specialties management page.');
        setSpecialties([]);
      } else {
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

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctor) {
      setError('Doctor data is missing');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updateData: UpdateDoctorDto = {
        specialtyIds: formData.specialtyIds,
        licenseNumber: formData.licenseNumber,
        experience: formData.experience,
        isVerified: formData.isVerified,
        isAvailable: formData.isAvailable,
        consultationFee: Math.round(formData.consultationFee * 100), // Convert to cents
        bio: formData.bio,
      };

      await doctorApi.updateDoctor(doctor.id, updateData);

      // Success - close modal and refresh list
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating doctor:', error);
      setError(error instanceof Error ? error.message : 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doctor) return null;

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
              <h2 className="text-2xl font-bold text-gray-900">Edit Doctor</h2>
              <p className="text-gray-600 mt-1">
                {doctor.user?.firstName} {doctor.user?.lastName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
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
                    loading={loadingSpecialties}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

              <div className="mt-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={formData.isVerified}
                    onChange={(e) => handleInputChange('isVerified', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isVerified" className="ml-2 text-sm font-medium text-gray-700">
                    Verified Doctor
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isAvailable" className="ml-2 text-sm font-medium text-gray-700">
                    Available for Appointments
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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
                  {loading ? 'Updating...' : 'Update Doctor'}
                </span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

