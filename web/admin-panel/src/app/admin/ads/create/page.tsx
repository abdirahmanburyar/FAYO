'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';
import { adsApi, CreateAdDto, AdStatus } from '@/services/adsApi';

export default function CreateAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    startDate: new Date().toISOString().split('T')[0],
    range: 7,
    price: 1.00, // Price per day in dollars (default $1.00)
    status: 'INACTIVE' as AdStatus,
  });
  const [fee, setFee] = useState<{ fee: number; feeInDollars: string } | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
        setError('Please select a valid image file (jpg, jpeg, png, gif, webp)');
        return;
      }
      setImageFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    if (!formData.company.trim()) {
      setError('Please enter company or person name');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload image first (like doctors/hospitals)
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);

      const adsServiceUrl = process.env.NEXT_PUBLIC_ADS_SERVICE_URL || 'http://72.62.51.50:3007';
      const uploadResponse = await fetch(`${adsServiceUrl}/api/v1/uploads`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      const uploadData = await uploadResponse.json();
      const fullImageUrl = `${adsServiceUrl}${uploadData.url}`;

      // 2. Create ad with the image URL
      const adData: CreateAdDto = {
        company: formData.company.trim(),
        imageUrl: fullImageUrl,
        startDate: new Date(formData.startDate).toISOString(),
        range: formData.range,
        price: formData.price, // Price per day in dollars
        status: formData.status === 'PENDING' ? 'PENDING' : formData.status,
        createdBy: 'ADMIN',
      };

      await adsApi.createAd(adData);
      router.push('/admin/ads');
    } catch (error) {
      console.error('Error creating ad:', error);
      setError(error instanceof Error ? error.message : 'Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  // Calculate end date for display
  const endDate = formData.startDate
    ? new Date(new Date(formData.startDate).getTime() + formData.range * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : '';

  // Calculate fee when range or price changes
  useEffect(() => {
    const calculateFee = async () => {
      if (formData.range > 0 && formData.price > 0) {
        setCalculatingFee(true);
        try {
          const result = await adsApi.calculateFee(formData.range, formData.price);
          setFee(result);
        } catch (err) {
          console.error('Error calculating fee:', err);
          setFee(null);
        } finally {
          setCalculatingFee(false);
        }
      } else {
        setFee(null);
      }
    };

    calculateFee();
  }, [formData.range, formData.price]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Advertisement</h1>
          <p className="text-gray-600 mt-2">Add a new advertisement</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Company/Person Name */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Company/Person</span>
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company or Person Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company or person name"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <ImageIcon className="w-5 h-5" />
            <span>Image</span>
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="sr-only"
                      onChange={handleImageChange}
                      required
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg max-h-64 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Date and Range */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Schedule</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Range (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.range}
                onChange={(e) => setFormData({ ...formData, range: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="7"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days (end date = start date + range)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Calculated)
              </label>
              <input
                type="date"
                value={endDate}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ad will be available from {formData.startDate} to {endDate} ({formData.range} days)
              </p>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Pricing</span>
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Day ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0.1"
              step="0.01"
              value={formData.price}
              onChange={(e) => {
                const priceInDollars = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, price: priceInDollars });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.00"
            />
            <p className="text-xs text-gray-500 mt-1">Price per day in dollars (minimum $0.10)</p>
          </div>
        </div>

        {/* Fee Calculation */}
        {fee && (
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Total Amount</span>
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Fee</p>
                  {calculatingFee ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">${fee.feeInDollars}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Calculation</p>
                  <p className="text-sm text-gray-700">
                    ${formData.price.toFixed(2)}/day × {formData.range} days
                  </p>
                  <p className="text-sm text-gray-700 font-semibold">
                    = ${fee.feeInDollars}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Note: Payment will be required after creating the ad. The ad will be published once payment is confirmed.
              </p>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-900">Status</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AdStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending (Requires Payment)</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select "Pending" to require payment before publishing. Only published ads within date range will be displayed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 border-t border-gray-200 pt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || !imageFile || !formData.company.trim() || formData.price <= 0}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Creating...' : 'Create Ad'}</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
