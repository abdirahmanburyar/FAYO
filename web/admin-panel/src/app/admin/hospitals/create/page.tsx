'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Save,
  AlertCircle,
  User
} from 'lucide-react';
import { hospitalApi } from '@/services/hospitalApi';
import { usersApi } from '@/services/usersApi';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface HospitalFormData {
  // User Account Information (for hospital login)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Hospital Information
  name: string;
  type: 'HOSPITAL' | 'CLINIC';
  address: string;
  city: string;
    website: string;
    bookingPolicy: 'HOSPITAL_ASSIGNED' | 'DIRECT_DOCTOR';
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

export default function CreateHospitalPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<HospitalFormData>({
    // User Account Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Hospital Information
    name: '',
    type: 'HOSPITAL',
    address: '',
    city: '',
    website: '',
    bookingPolicy: 'DIRECT_DOCTOR',
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof HospitalFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
      return Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Step 1: Create or find user account for the hospital
      console.log('🔍 [HOSPITAL] Starting user lookup/creation process...');
      let user;
      
      try {
        // Generate sequential numeric username
        const username = await generateSequentialUsername();
        console.log('📝 [HOSPITAL] Generated sequential username:', username);
        
        // First try to find existing user by email or phone
        const existingUsers = await usersApi.getUsers();
        console.log('📋 [HOSPITAL] Fetched existing users:', existingUsers?.length || 0);
        
        const existingUser = existingUsers.find(u => 
          u.email === formData.email || u.phone === formData.phone
        );
        
        if (existingUser) {
          console.log('✅ [HOSPITAL] Using existing user:', {
            id: existingUser.id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            email: existingUser.email
          });
          user = existingUser;
        } else {
          console.log('🆕 [HOSPITAL] No existing user found, creating new user...');
          // Determine role based on hospital type
          const role = formData.type === 'HOSPITAL' ? 'HOSPITAL' : 'CLINIC';
          const userType = 'HOSPITAL_MANAGER' as const;
          
          // Create new user if none exists
          const userData = {
            username: username,
            email: formData.email,
            phone: formData.phone,
            password: 'password', // Default password
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: role as 'HOSPITAL' | 'CLINIC',
            userType: userType,
          };

          user = await usersApi.createUser(userData);
          console.log('✅ [HOSPITAL] New user created:', {
            id: user?.id,
            username: user?.username,
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
            role: user?.role,
            userType: user?.userType
          });
        }
      } catch (error: any) {
        console.error('❌ [HOSPITAL] Error handling user creation:', error);
        // If user creation fails due to conflict, try to find the existing user
        if (error?.status === 409) {
          console.log('🔄 [HOSPITAL] User creation failed due to conflict, searching for existing user...');
          const existingUsers = await usersApi.getUsers();
          const existingUser = existingUsers.find(u => 
            u.email === formData.email || u.phone === formData.phone
          );
          if (existingUser) {
            console.log('✅ [HOSPITAL] Found existing user after conflict:', existingUser.id);
            user = existingUser;
          } else {
            console.error('❌ [HOSPITAL] No existing user found after conflict');
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

      console.log('✅ [HOSPITAL] User validated:', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });

      // Step 2: Create hospital with userId
      const hospitalData = {
        userId: user.id, // Link hospital to user account
        name: formData.name,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        bookingPolicy: formData.bookingPolicy,
        isActive: formData.isActive
      };

      console.log('📤 [HOSPITAL] Creating hospital with data:', hospitalData);
      await hospitalApi.createHospital(hospitalData);

      // Redirect to hospitals list
      router.push('/admin/hospitals');
    } catch (error) {
      console.error('Error creating hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to create hospital');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Add New Hospital</h1>
          <p className="text-gray-600 mt-2">
            Create a new healthcare facility
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
            {/* User Account Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <User className="w-5 h-5 mr-2" />
                Hospital Account Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a user account for the hospital to access their web portal
              </p>
              
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
                      placeholder="hospital@example.com"
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
            </div>

            {/* Hospital Information Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
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
                {loading ? 'Creating...' : 'Create Hospital'}
              </span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
