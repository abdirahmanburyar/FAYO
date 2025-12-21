'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Building2
} from 'lucide-react';
import { specialtiesApi, Specialty } from '@/services/specialtiesApi';
import { SkeletonStats, SkeletonCard } from '@/components/skeletons';
import { SearchableSelect, SelectOption } from '@/components/ui';
import SpecialtyModal from '@/components/SpecialtyModal';

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

  // Fetch specialties from API
  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      setError(null);
      const specialtiesData = await specialtiesApi.getSpecialties(true); // Include inactive
      setSpecialties(specialtiesData);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch specialties';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const filteredSpecialties = specialties.filter(specialty => {
    const matchesSearch = specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialty.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' ||
                         (filterStatus === 'ACTIVE' && specialty.isActive) ||
                         (filterStatus === 'INACTIVE' && !specialty.isActive);

    return matchesSearch && matchesStatus;
  });


  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  
  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <SkeletonStats count={4} />

        {/* Filters Skeleton */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="lg:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Specialties Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Specialties</h1>
          <p className="text-gray-600 mt-2">Manage medical specialties and categories</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Specialties</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Specialties</h1>
          <p className="text-gray-600 mt-2">Manage medical specialties and categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingSpecialty(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Specialty</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Specialties</p>
              <p className="text-2xl font-bold text-gray-900">{specialties.length}</p>
            </div>
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Specialties</p>
              <p className="text-2xl font-bold text-green-600">
                {specialties.filter(s => s.isActive).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Specialties</p>
              <p className="text-2xl font-bold text-red-600">
                {specialties.filter(s => !s.isActive).length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-purple-600">
                {specialties.length > 0 ? 'N/A' : '0'}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>


          {/* Status Filter */}
          <div className="lg:w-48">
            <SearchableSelect
              options={statusOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as string)}
              placeholder="All Status"
              searchPlaceholder="Search status..."
              allowClear={false}
            />
          </div>
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecialties.map((specialty, index) => (
          <motion.div
            key={specialty.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {specialty.name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-900 p-1" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setEditingSpecialty(specialty);
                    setIsModalOpen(true);
                  }}
                  className="text-green-600 hover:text-green-900 p-1" 
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={async () => {
                    if (confirm(`Are you sure you want to delete "${specialty.name}"?`)) {
                      try {
                        await specialtiesApi.deleteSpecialty(specialty.id);
                        fetchSpecialties(); // Refresh the list
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Failed to delete specialty');
                      }
                    }
                  }}
                  className="text-red-600 hover:text-red-900 p-1" 
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {specialty.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {specialty.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(specialty.isActive)}`}>
                  {specialty.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {new Date(specialty.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSpecialties.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No specialties found</h3>
          <p className="text-gray-500 mb-4">
            {specialties.length === 0 
              ? 'Get started by adding your first specialty.' 
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {specialties.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingSpecialty(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Specialty</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Specialty Modal */}
      <SpecialtyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSpecialty(null);
        }}
        onSuccess={() => {
          fetchSpecialties(); // Refresh the list after successful create/update
        }}
        specialty={editingSpecialty}
      />
    </div>
  );
}
