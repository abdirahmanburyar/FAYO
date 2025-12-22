'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { hospitalApi, Hospital, UpdateHospitalDto } from '@/services/hospitalApi';
import { getHospitalId, getHospitalData } from '@/utils/hospital';
import { SkeletonCard } from '@/components/skeletons';

export default function SettingsPage() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateHospitalDto>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const hospitalId = getHospitalId();
        if (!hospitalId) {
          setError('Hospital ID not found. Please log in again.');
          return;
        }

        const hospitalData = await hospitalApi.getHospitalById(hospitalId);
        setHospital(hospitalData);
        setFormData({
          name: hospitalData.name || '',
          address: hospitalData.address || '',
          city: hospitalData.city || '',
          phone: hospitalData.phone || '',
          email: hospitalData.email || '',
          website: hospitalData.website || '',
        });
      } catch (error) {
        console.error('Error fetching hospital:', error);
        setError(error instanceof Error ? error.message : 'Failed to load hospital data');
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const hospitalId = getHospitalId();
      if (!hospitalId) {
        setError('Hospital ID not found. Please log in again.');
        return;
      }

      // Only send fields that have values
      const updateData: UpdateHospitalDto = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.address) updateData.address = formData.address;
      if (formData.city) updateData.city = formData.city;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.email) updateData.email = formData.email;
      if (formData.website) updateData.website = formData.website;

      const updatedHospital = await hospitalApi.updateHospital(hospitalId, updateData);
      setHospital(updatedHospital);
      
      // Update localStorage
      const hospitalData = getHospitalData();
      if (hospitalData) {
        localStorage.setItem('hospitalData', JSON.stringify({
          ...hospitalData,
          name: updatedHospital.name,
        }));
      }

      setSuccess('Hospital settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to update hospital settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateHospitalDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your hospital information</p>
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your hospital information</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Settings</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your hospital information and preferences</p>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-800">{success}</p>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Hospital Information Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Hospital Information</h2>
          </div>

          <div className="space-y-6">
            {/* Hospital Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter hospital name"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter hospital address"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>

      {/* Hospital Type Info */}
      {hospital && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium text-gray-900">{hospital.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${hospital.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {hospital.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(hospital.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(hospital.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

