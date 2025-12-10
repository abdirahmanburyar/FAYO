'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, FileText, Activity, TrendingUp, Clock, Megaphone } from 'lucide-react';
import { SkeletonStats, SkeletonList } from '@/components/skeletons';
import { adsApi, Ad } from '@/services/adsApi';

const stats = [
  {
    title: 'Total Users',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Active Appointments',
    value: '89',
    change: '+5%',
    changeType: 'positive',
    icon: Calendar,
    color: 'green',
  },
  {
    title: 'Pending Reviews',
    value: '23',
    change: '-3%',
    changeType: 'negative',
    icon: FileText,
    color: 'orange',
  },
  {
    title: 'System Health',
    value: '99.9%',
    change: '+0.1%',
    changeType: 'positive',
    icon: Activity,
    color: 'purple',
  },
];

const recentActivities = [
  {
    id: 1,
    type: 'user_registration',
    message: 'New user registered: Dr. Ahmed Hassan',
    time: '2 minutes ago',
    icon: Users,
  },
  {
    id: 2,
    type: 'appointment_created',
    message: 'Appointment scheduled for tomorrow at 10:00 AM',
    time: '15 minutes ago',
    icon: Calendar,
  },
  {
    id: 3,
    type: 'profile_update',
    message: 'User profile updated: Sarah Mohamed',
    time: '1 hour ago',
    icon: FileText,
  },
  {
    id: 4,
    type: 'system_alert',
    message: 'System maintenance completed successfully',
    time: '2 hours ago',
    icon: Activity,
  },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch published ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setAdsLoading(true);
        const response = await adsApi.getAds(true, 1, 20); // Get active/published ads
        setAds(response.data.filter(ad => ad.status === 'PUBLISHED'));
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setAdsLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Auto-scroll ads
  useEffect(() => {
    if (ads.length <= 1 || !scrollRef.current) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current;
        const scrollWidth = scrollContainer.scrollWidth;
        const clientWidth = scrollContainer.clientWidth;
        const currentScroll = scrollContainer.scrollLeft;
        
        if (currentScroll + clientWidth >= scrollWidth - 10) {
          // Reset to start
          scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll to next
          scrollContainer.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [ads]);

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
          Welcome to the FAYO Healthcare Admin Panel
        </p>
      </div>

      {/* Auto-Scrollable Ads Carousel */}
      {ads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Megaphone className="w-5 h-5" />
              <span>Active Advertisements</span>
            </h2>
          </div>
          <div
            ref={scrollRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ads.map((ad) => {
              const baseUrl = process.env.NEXT_PUBLIC_ADS_SERVICE_URL || 'http://72.62.51.50:3007';
              return (
                <div
                  key={ad.id}
                  className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3"
                >
                  <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={`${baseUrl}${ad.image}`}
                      alt={ad.company}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white font-semibold">{ad.company}</p>
                      <p className="text-white/80 text-sm">
                        {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
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
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <activity.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
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
            <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Manage Users</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">View Appointments</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-900">System Reports</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">System Settings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
