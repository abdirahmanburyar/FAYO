'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Stethoscope,
  Building2,
  Palette,
  BookOpen,
  Megaphone
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser;
}

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { name: 'Specialties', href: '/admin/specialties', icon: BookOpen },
  { name: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
  { name: 'Appointments', href: '/admin/appointments', icon: Calendar },
  { name: 'Advertisements', href: '/admin/ads', icon: Megaphone },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Components', href: '/admin/components', icon: Palette },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose, adminUser }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  const handleMenuClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 lg:bg-white lg:shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center relative">
                <img 
                  src="/logo.png" 
                  alt="FAYO Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'logo-fallback w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center';
                      fallback.innerHTML = '<span class="text-white font-bold text-xs">FAYO</span>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">FAYO Admin</h1>
                <p className="text-xs text-gray-500">Healthcare Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => handleMenuClick(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors group ${
                    active
                      ? 'bg-blue-50 border-r-2 border-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${
                    active
                      ? 'text-blue-600'
                      : 'text-gray-600 group-hover:text-blue-600'
                  }`} />
                  <span className={`text-sm font-medium transition-colors ${
                    active
                      ? 'text-blue-600'
                      : 'text-gray-700 group-hover:text-blue-600'
                  }`}>
                    {item.name}
                  </span>
                </motion.button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-red-50 transition-colors group"
            >
              <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
                Sign Out
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center relative">
                    <img 
                      src="/logo.png" 
                      alt="FAYO Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'logo-fallback w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center';
                          fallback.innerHTML = '<span class="text-white font-bold text-xs">FAYO</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">FAYO Admin</h1>
                    <p className="text-xs text-gray-500">Healthcare Panel</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item, index) => {
                  const active = isActive(item.href);
                  return (
                    <motion.button
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => handleMenuClick(item.href)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors group ${
                        active
                          ? 'bg-blue-50 border-r-2 border-blue-600'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 transition-colors ${
                        active
                          ? 'text-blue-600'
                          : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                      <span className={`text-sm font-medium transition-colors ${
                        active
                          ? 'text-blue-600'
                          : 'text-gray-700 group-hover:text-blue-600'
                      }`}>
                        {item.name}
                      </span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-gray-200">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg hover:bg-red-50 transition-colors group"
                >
                  <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
                    Sign Out
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
