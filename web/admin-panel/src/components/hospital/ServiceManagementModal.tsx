'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Stethoscope, AlertCircle, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { SearchableSelect, SelectOption } from '@/components/ui';
import { hospitalManagementApi, AddServiceRequest } from '@/services/hospitalManagementApi';

interface ServiceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddServiceRequest) => Promise<void>;
  hospitalId: string;
  hospitalName: string;
}

export default function ServiceManagementModal({
  isOpen,
  onClose,
  onAdd,
  hospitalId,
  hospitalName
}: ServiceManagementModalProps) {
  const [availableServices, setAvailableServices] = useState<SelectOption[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableServices();
    }
  }, [isOpen]);

  const loadAvailableServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const services = await hospitalManagementApi.getAvailableServices();
      setAvailableServices(
        services.map(service => ({
          value: service.id,
          label: service.name
        }))
      );
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Failed to load available services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      setError('Please select a service');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const selectedSvc = availableServices.find(svc => svc.value === selectedService);
      if (!selectedSvc) {
        setError('Selected service not found');
        return;
      }

      await onAdd({
        serviceId: selectedService,
        serviceName: selectedSvc.label,
        description: description || undefined,
        price: price ? Math.round(parseFloat(price) * 100) : undefined, // Convert to cents
        duration: duration ? parseInt(duration) : undefined
      });

      // Reset form
      setSelectedService('');
      setPrice('');
      setDuration('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error adding service:', error);
      setError(error instanceof Error ? error.message : 'Failed to add service');
    } finally {
      setLoading(false);
    }
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Service</h3>
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
                Select Service
              </label>
              <SearchableSelect
                options={availableServices}
                value={selectedService}
                onChange={(value) => setSelectedService(value as string)}
                placeholder="Choose a service..."
                searchPlaceholder="Search services..."
                loading={loading}
                allowClear={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter service description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">What happens next?</p>
                  <p className="mt-1">
                    The selected service will be added to {hospitalName} and can be managed from the services page.
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
              disabled={loading || !selectedService}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{loading ? 'Adding...' : 'Add Service'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
