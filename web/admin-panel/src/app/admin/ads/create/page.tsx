'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  Megaphone,
} from 'lucide-react';
import { adsApi, CreateAdDto } from '@/services/adsApi';

export default function CreateAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    days: 7,
  });

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

    setLoading(true);

    try {
      const adData: CreateAdDto = {
        image: imageFile,
        startDate: new Date(formData.startDate).toISOString(),
        days: formData.days,
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
    ? new Date(new Date(formData.startDate).getTime() + formData.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : '';

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
          <p className="text-gray-600 mt-2">Upload an image and set the display period</p>
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
        {/* Image Upload */}
        <div className="space-y-4">
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

        {/* Date and Duration */}
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
                Duration (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="7"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days the ad will be active</p>
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
                Ad will be active from {formData.startDate} to {endDate} ({formData.days} days)
              </p>
            </div>
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
            disabled={loading || !imageFile}
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
