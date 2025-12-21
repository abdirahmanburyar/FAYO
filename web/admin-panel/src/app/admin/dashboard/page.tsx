'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Clock, 
  Megaphone,
  Hospital,
  UserCheck,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { SkeletonStats } from '@/components/skeletons';
import { adsApi, Ad } from '@/services/adsApi';
import { usersApi } from '@/services/usersApi';
import { appointmentsApi, Appointment } from '@/services/appointmentsApi';
import { paymentApi, Payment } from '@/services/paymentApi';
import { hospitalApi } from '@/services/hospitalApi';
import { doctorApi } from '@/services/doctorApi';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalHospitals: number;
  totalAppointments: number;
  activeAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalAds: number;
  activeAds: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalAppointments: 0,
    activeAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalAds: 0,
    activeAds: 0,
  });
  const [ads, setAds] = useState<Ad[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [
          usersData,
          doctorsData,
          hospitalsData,
          appointmentsData,
          paymentsData,
          adsData,
        ] = await Promise.allSettled([
          usersApi.getUsers(),
          doctorApi.getDoctors(),
          hospitalApi.getHospitals(),
          appointmentsApi.getAppointments(),
          paymentApi.getAllPayments({}),
          adsApi.getAds(false, 1, 100),
        ]);

        // Process users
        const usersList = usersData.status === 'fulfilled' ? usersData.value : [];
        setUsers(usersList);
        const totalUsers = usersList.length;
        const patients = usersList.filter(u => u.role === 'PATIENT' || u.userType === 'PATIENT').length;

        // Process doctors
        const doctorsList = doctorsData.status === 'fulfilled' ? doctorsData.value : [];
        const totalDoctors = doctorsList.length;

        // Process hospitals
        const hospitalsList = hospitalsData.status === 'fulfilled' ? hospitalsData.value : [];
        const totalHospitals = hospitalsList.length;

        // Process appointments
        const appointmentsList = appointmentsData.status === 'fulfilled' ? appointmentsData.value : [];
        setAppointments(appointmentsList);
        const totalAppointments = appointmentsList.length;
        const activeAppointments = appointmentsList.filter(
          a => a.status === 'PENDING' || a.status === 'CONFIRMED'
        ).length;
        const completedAppointments = appointmentsList.filter(
          a => a.status === 'COMPLETED'
        ).length;

        // Get recent appointments (last 5)
        const recent = [...appointmentsList]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentAppointments(recent);

        // Process payments
        const paymentsList = paymentsData.status === 'fulfilled' ? paymentsData.value : [];
        setPayments(paymentsList);
        const totalRevenue = paymentsList
          .filter(p => p.paymentStatus === 'PAID')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Calculate monthly revenue (current month)
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = paymentsList
          .filter(p => {
            if (p.paymentStatus !== 'PAID') return false;
            const paymentDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt);
            return paymentDate >= currentMonthStart;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Process ads
        const adsList = adsData.status === 'fulfilled' ? adsData.value.data || [] : [];
        setAds(adsList);
        const totalAds = adsList.length;
        const activeAds = adsList.filter(a => a.status === 'PUBLISHED').length;

        // Update stats
        setStats({
          totalUsers,
          totalDoctors,
          totalHospitals,
          totalAppointments,
          activeAppointments,
          completedAppointments,
          totalRevenue,
          monthlyRevenue,
          totalAds,
          activeAds,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const revenueChartData = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthRevenue = payments
        .filter(p => {
          if (p.paymentStatus !== 'PAID') return false;
          const paymentDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.createdAt);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue / 100, // Convert cents to dollars
      });
    }
    
    return last6Months;
  }, [payments]);

  const appointmentsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
      value: count,
    }));
  }, [appointments]);

  const paymentMethodsData = useMemo(() => {
    const methodCounts: Record<string, number> = {};
    payments
      .filter(p => p.paymentStatus === 'PAID')
      .forEach(payment => {
        const method = payment.paymentMethod || 'OTHER';
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });
    
    return Object.entries(methodCounts).map(([method, count]) => ({
      name: method.replace('_', ' '),
      value: count,
    }));
  }, [payments]);

  const userGrowthData = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthUsers = users.filter(u => {
        const createdDate = new Date(u.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;
      
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        users: monthUsers,
      });
    }
    
    return last6Months;
  }, [users]);

  const appointmentTypesData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      const type = apt.consultationType || 'IN_PERSON';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.replace('_', ' '),
      value: count,
    }));
  }, [appointments]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
        </div>
        <SkeletonStats count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue',
      onClick: () => router.push('/admin/users'),
    },
    {
      title: 'Active Appointments',
      value: stats.activeAppointments.toLocaleString(),
      change: `${((stats.activeAppointments / Math.max(stats.totalAppointments, 1)) * 100).toFixed(0)}%`,
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'green',
      onClick: () => router.push('/admin/appointments'),
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `$${(stats.monthlyRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} this month`,
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'purple',
      onClick: () => router.push('/admin/reports/payments'),
    },
    {
      title: 'Doctors',
      value: stats.totalDoctors.toLocaleString(),
      change: `${stats.totalHospitals} hospitals`,
      changeType: 'neutral' as const,
      icon: UserCheck,
      color: 'orange',
      onClick: () => router.push('/admin/doctors'),
    },
    {
      title: 'Hospitals',
      value: stats.totalHospitals.toLocaleString(),
      change: `${stats.activeAds} active ads`,
      changeType: 'neutral' as const,
      icon: Hospital,
      color: 'blue',
      onClick: () => router.push('/admin/hospitals'),
    },
    {
      title: 'Completed Appointments',
      value: stats.completedAppointments.toLocaleString(),
      change: `${((stats.completedAppointments / Math.max(stats.totalAppointments, 1)) * 100).toFixed(0)}% completion rate`,
      changeType: 'positive' as const,
      icon: Activity,
      color: 'green',
      onClick: () => router.push('/admin/appointments'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the FAYO Healthcare Admin Panel - Real-time analytics and insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={stat.onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'positive' && (
                    <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                  )}
                  {stat.changeType === 'negative' && (
                    <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue'
                    ? 'bg-blue-100 text-blue-600'
                    : stat.color === 'green'
                    ? 'bg-green-100 text-green-600'
                    : stat.color === 'orange'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-purple-100 text-purple-600'
                }`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Revenue Over Time</span>
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Appointments by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Appointments by Status</span>
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={appointmentsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {appointmentsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Methods Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Payment Methods</span>
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Growth</span>
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Appointments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
          <button
            onClick={() => router.push('/admin/appointments')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>
        <div className="space-y-4">
          {recentAppointments.length > 0 ? (
            recentAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                    appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-600' :
                    appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Appointment #{appointment.appointmentNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ${((appointment.consultationFee || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent appointments</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
