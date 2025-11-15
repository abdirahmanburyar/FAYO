'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserCheck, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { SearchableSelect, SelectOption } from '@/components/ui';
import { hospitalManagementApi, AddDoctorRequest } from '@/services/hospitalManagementApi';

interface DoctorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddDoctorRequest) => Promise<void>;
  hospitalId: string;
  hospitalName: string;
}

export default function DoctorManagementModal({
  isOpen,
  onClose,
  onAdd,
  hospitalId,
  hospitalName
}: DoctorManagementModalProps) {
  const [availableDoctors, setAvailableDoctors] = useState<SelectOption[]>([]);
  const [doctorRoles, setDoctorRoles] = useState<SelectOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('CONSULTANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [doctors, roles] = await Promise.all([
        hospitalManagementApi.getAvailableDoctors(),
        hospitalManagementApi.getDoctorRoles()
      ]);
      
      setAvailableDoctors(
        doctors.map(doctor => ({
          value: doctor.id,
          label: `Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.specialty}`
        }))
      );
      
      setDoctorRoles(roles);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load available data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onAdd({
        doctorId: selectedDoctor,
        role: selectedRole
      });

      // Reset form
      setSelectedDoctor('');
      setSelectedRole('CONSULTANT');
      onClose();
    } catch (error) {
      console.error('Error adding doctor:', error);
      setError(error instanceof Error ? error.message : 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role: string) => {
    const descriptions: { [key: string]: string } = {
      'HEAD_OF_DEPARTMENT': 'Leads and manages the department',
      'CONSULTANT': 'Senior medical professional providing expert care',
      'SENIOR_CONSULTANT': 'Highly experienced consultant with advanced expertise',
      'RESIDENT': 'Doctor in training under supervision',
      'INTERN': 'Newly graduated doctor in training',
      'GENERAL_PRACTITIONER': 'Primary care physician for general health issues'
    };
    return descriptions[role] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Doctor</h3>
                <p className="text-sm text-gray-500">{hospitalName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor
              </label>
              <SearchableSelect
                options={availableDoctors}
                value={selectedDoctor}
                onChange={(value) => setSelectedDoctor(value as string)}
                placeholder="Choose a doctor..."
                searchPlaceholder="Search doctors..."
                loading={loading}
                allowClear={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline mr-1" />
                Role in Hospital
              </label>
              <SearchableSelect
                options={doctorRoles}
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as string)}
                placeholder="Select role..."
                searchPlaceholder="Search roles..."
                allowClear={false}
              />
              {selectedRole && (
                <p className="mt-2 text-sm text-gray-600">
                  {getRoleDescription(selectedRole)}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">What happens next?</p>
                  <p className="mt-1">
                    The selected doctor will be added to {hospitalName} with the specified role and can be managed from the doctors page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedDoctor || !selectedRole}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{loading ? 'Adding...' : 'Add Doctor'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
