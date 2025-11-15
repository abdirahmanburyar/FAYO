'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('overview');

  const reportTypes = [
    {
      id: 'overview',
      name: 'Overview',
      description: 'General system statistics and KPIs',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'users',
      name: 'User Analytics',
      description: 'User registration and activity trends',
      icon: Users,
      color: 'green'
    },
    {
      id: 'appointments',
      name: 'Appointment Reports',
      description: 'Appointment scheduling and completion rates',
      icon: Calendar,
      color: 'purple'
    },
    {
      id: 'revenue',
      name: 'Revenue Analysis',
      description: 'Financial performance and billing reports',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const mockData = {
    overview: {
      totalUsers: 1247,
      activeUsers: 892,
      totalAppointments: 3456,
      completedAppointments: 3123,
      revenue: 45678,
      growthRate: 12.5
    },
    users: {
      newRegistrations: 45,
      activeUsers: 892,
      userRetention: 78.5,
      topSpecialties: ['General Medicine', 'Cardiology', 'Dermatology']
    },
    appointments: {
      totalScheduled: 3456,
      completed: 3123,
      cancelled: 156,
      noShow: 177,
      averageWaitTime: 15
    },
    revenue: {
      totalRevenue: 45678,
      monthlyGrowth: 8.2,
      topRevenueSources: ['Consultations', 'Procedures', 'Medications']
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights and analytics for your healthcare platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </motion.button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedReport(report.id)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedReport === report.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(report.color)}`}>
                <report.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-500">{report.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.overview.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-green-600">+{mockData.overview.growthRate}% from last month</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{mockData.overview.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">71.5% of total users</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-purple-600">{mockData.overview.totalAppointments.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">This period</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">${mockData.overview.revenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600">+8.2% from last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Trend</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart will be implemented with Chart.js</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status Distribution</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart will be implemented with Chart.js</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Analytics Report */}
      {selectedReport === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Registrations</h3>
              <p className="text-3xl font-bold text-blue-600">{mockData.users.newRegistrations}</p>
              <p className="text-sm text-gray-500 mt-2">This {selectedPeriod === '7d' ? 'week' : 'month'}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Retention</h3>
              <p className="text-3xl font-bold text-green-600">{mockData.users.userRetention}%</p>
              <p className="text-sm text-gray-500 mt-2">Monthly retention rate</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Users</h3>
              <p className="text-3xl font-bold text-purple-600">{mockData.users.activeUsers}</p>
              <p className="text-sm text-gray-500 mt-2">Currently active</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Medical Specialties</h3>
            <div className="space-y-3">
              {mockData.users.topSpecialties.map((specialty, index) => (
                <div key={specialty} className="flex items-center justify-between">
                  <span className="text-gray-700">{specialty}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${85 - index * 15}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">{85 - index * 15}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Appointment Reports */}
      {selectedReport === 'appointments' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Scheduled</h3>
              <p className="text-3xl font-bold text-blue-600">{mockData.appointments.totalScheduled}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
              <p className="text-3xl font-bold text-green-600">{mockData.appointments.completed}</p>
              <p className="text-sm text-gray-500">90.4% completion rate</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelled</h3>
              <p className="text-3xl font-bold text-red-600">{mockData.appointments.cancelled}</p>
              <p className="text-sm text-gray-500">4.5% cancellation rate</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Show</h3>
              <p className="text-3xl font-bold text-orange-600">{mockData.appointments.noShow}</p>
              <p className="text-sm text-gray-500">5.1% no-show rate</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Wait Time</h3>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-blue-600">{mockData.appointments.averageWaitTime}</div>
              <div className="text-gray-500">minutes</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Revenue Analysis */}
      {selectedReport === 'revenue' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Revenue</h3>
              <p className="text-4xl font-bold text-green-600">${mockData.revenue.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2">+{mockData.revenue.monthlyGrowth}% from last month</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth</h3>
              <p className="text-4xl font-bold text-blue-600">+{mockData.revenue.monthlyGrowth}%</p>
              <p className="text-sm text-gray-500 mt-2">Compared to previous month</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Sources</h3>
            <div className="space-y-4">
              {mockData.revenue.topRevenueSources.map((source, index) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-gray-700">{source}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full" 
                        style={{ width: `${70 - index * 20}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">{70 - index * 20}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
