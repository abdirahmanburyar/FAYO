'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, FileText, Activity, TrendingUp, Clock, DollarSign, Stethoscope } from 'lucide-react';
import { SkeletonStats, SkeletonList } from '@/components/skeletons';
import { appointmentsApi, Appointment } from '@/services/appointmentsApi';
import { hospitalApi } from '@/services/hospitalApi';
import { doctorApi } from '@/services/doctorApi';
import { getHospitalId } from '@/utils/hospital';

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  totalDoctors: number;
  totalRevenue: number;
  todayAppointments: number;
}

export default function HospitalDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    totalDoctors: 0,
    totalRevenue: 0,
    todayAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const hospitalId = getHospitalId();
        if (!hospitalId) {
          setError('Hospital ID not found. Please log in again.');
          return;
        }

        // Fetch appointments for this hospital
        const appointments = await appointmentsApi.getAppointments({ hospitalId });
        
        // Calculate stats from appointments
        const totalAppointments = appointments.length;
        const pendingAppointments = appointments.filter(a => a.status === 'PENDING').length;
        const confirmedAppointments = appointments.filter(a => a.status === 'CONFIRMED').length;
        const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
        
        // Calculate revenue from paid appointments (fee is in dollars from API)
        const paidAppointments = appointments.filter(a => a.paymentStatus === 'PAID');
        const totalRevenue = paidAppointments.reduce((sum, apt) => sum + (apt.consultationFee || 0), 0);
        
        // Count today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        }).length;

        // Fetch doctors for this hospital
        let totalDoctors = 0;
        try {
          const doctors = await hospitalApi.getDoctors(hospitalId);
          totalDoctors = doctors.length;
        } catch (err) {
          console.error('Error fetching doctors:', err);
        }

        // Get recent appointments (last 5, sorted by date)
        const recent = appointments
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          totalAppointments,
          pendingAppointments,
          confirmedAppointments,
          completedAppointments,
          totalDoctors,
          totalRevenue,
          todayAppointments,
        });
        
        setRecentAppointments(recent);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
        </div>

        {/* Stats Skeleton */}
        <SkeletonStats count={4} />

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities Skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <SkeletonList items={4} />
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-6"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-3">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ))}
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the FAYO Healthcare Hospital Panel
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalAppointments}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.todayAppointments} today</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pendingAppointments}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting confirmation</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.totalDoctors}</p>
              <p className="text-xs text-gray-500 mt-2">Active doctors</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">From paid appointments</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
            <a href="/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No recent appointments</p>
              </div>
            ) : (
              recentAppointments.map((appointment, index) => {
                const appointmentDate = new Date(appointment.appointmentDate);
                const timeAgo = getTimeAgo(new Date(appointment.createdAt));
                
                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        Appointment #{appointment.appointmentNumber || appointment.id.slice(0, 8)} - {appointment.status}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {appointment.appointmentTime} • {timeAgo}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/appointments"
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">View Appointments</span>
            </a>
            <a
              href="/doctors"
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Manage Doctors</span>
            </a>
            <a
              href="/reports/payments"
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-900">Payment Reports</span>
            </a>
            <a
              href="/settings"
              className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Settings</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

