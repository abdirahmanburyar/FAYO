'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { hospitalApi } from '@/services/hospitalApi';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface HospitalFormData {
  name: string;
  type: 'HOSPITAL' | 'CLINIC';
  address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
    bookingPolicy: 'DIRECT_DOCTOR' | 'HOSPITAL_ASSIGNED';
    isActive: boolean;
}

const somaliCities = [
  'Mogadishu',
  'Hargeisa',
  'Kismayo',
  'Garowe',
  'Bosaso',
  'Galkayo',
  'Baidoa',
  'Beledweyne',
  'Jowhar',
  'Burao',
  'Berbera',
  'Erigavo',
  'Las Anod',
  'Dhuusamarreeb',
  'Cadaado',
  'Ceerigaabo',
  'Laas Caanood',
  'Qardho',
  'Caynabo',
  'Buuhoodle'
].map(city => ({
  value: city,
  label: city
}));

export default function EditHospitalPage() {
  const router = useRouter();
  const params = useParams();
  const hospitalId = params.id as string;
  
  const [formData, setFormData] = useState<HospitalFormData>({
    name: '',
    type: 'HOSPITAL',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    bookingPolicy: 'DIRECT_DOCTOR',
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load hospital data
  useEffect(() => {
    const loadHospital = async () => {
      try {
        setInitialLoading(true);
        const hospital = await hospitalApi.getHospital(hospitalId);
        
        setFormData({
          name: hospital.name,
          type: hospital.type,
          address: hospital.address,
          city: hospital.city,
          phone: hospital.phone || '',
          email: hospital.email || '',
          website: hospital.website || '',
          logoUrl: hospital.logoUrl || '',
          bookingPolicy: hospital.bookingPolicy || 'DIRECT_DOCTOR',
          isActive: hospital.isActive
        });
      } catch (error) {
        console.error('Error loading hospital:', error);
        setError(error instanceof Error ? error.message : 'Failed to load hospital');
      } finally {
        setInitialLoading(false);
      }
    };

    if (hospitalId) {
      loadHospital();
    }
  }, [hospitalId]);

  const handleInputChange = (field: keyof HospitalFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      console.log('🏥 Form submission started');
      console.log('🏥 Hospital ID:', hospitalId);
      console.log('🏥 Form data:', formData);

      // Update hospital
      const hospitalData = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        logoUrl: formData.logoUrl || undefined,
        bookingPolicy: formData.bookingPolicy,
        isActive: formData.isActive
      };

      console.log('🏥 Hospital data to send:', hospitalData);

      const result = await hospitalApi.updateHospital(hospitalId, hospitalData);
      console.log('🏥 Update result:', result);

      // Redirect to hospitals list
      router.push('/admin/hospitals');
    } catch (error) {
      console.error('Error updating hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to update hospital');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading hospital data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Hospital</h1>
          <p className="text-gray-600 mt-2">
            Update hospital information
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Hospital Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter hospital name"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Type"
                  required
                  options={[
                    { value: 'HOSPITAL', label: 'Hospital' },
                    { value: 'CLINIC', label: 'Clinic' }
                  ]}
                  value={formData.type}
                  onChange={(value) => handleInputChange('type', value as 'HOSPITAL' | 'CLINIC')}
                  placeholder="Select type"
                  searchPlaceholder="Search types..."
                />
              </div>

              <div>
                <SearchableSelect
                  label="City"
                  required
                  options={somaliCities}
                  value={formData.city}
                  onChange={(value) => handleInputChange('city', value as string)}
                  placeholder="Select city"
                  searchPlaceholder="Search cities..."
                  allowClear
                />
              </div>

              <div>
                <SearchableSelect
                  label="Booking Policy"
                  required
                  options={[
                    { value: 'DIRECT_DOCTOR', label: 'Patient Selects Doctor' },
                    { value: 'HOSPITAL_ASSIGNED', label: 'Hospital Assigns Doctor' }
                  ]}
                  value={formData.bookingPolicy}
                  onChange={(value) => handleInputChange('bookingPolicy', value as 'DIRECT_DOCTOR' | 'HOSPITAL_ASSIGNED')}
                  placeholder="Select booking policy"
                  searchPlaceholder="Search policies..."
                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+252907700949"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="hospital@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://hospital.example.com"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Hospital is active and accepting patients
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
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
                {loading ? 'Updating...' : 'Update Hospital'}
              </span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
