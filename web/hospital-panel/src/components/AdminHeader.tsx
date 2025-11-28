'use client';

import { motion } from 'framer-motion';
import { Menu, Bell, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminHeaderProps {
  onMenuClick: () => void;
  adminUser: AdminUser;
}

export default function AdminHeader({ onMenuClick, adminUser }: AdminHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 1) return 'Dashboard';
    
    const segment = pathSegments[1];
    const titleMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'hospitals': 'Hospitals & Clinics',
      'users': 'Users',
      'doctors': 'Doctors',
      'appointments': 'Appointments',
      'reports': 'Reports',
      'settings': 'Settings',
    };
    
    return titleMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          {/* Page Title */}
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>
          
          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </motion.button>

          {/* Admin User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {adminUser.firstName} {adminUser.lastName}
              </p>
              <p className="text-xs text-gray-500">@{adminUser.username}</p>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer"
            >
              <User className="w-5 h-5 text-white" />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
