'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import Breadcrumb from '@/components/Breadcrumb';

interface HospitalUser {
  id: string;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface HospitalData {
  id: string;
  name: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hospitalUser, setHospitalUser] = useState<HospitalUser | null>(null);
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if hospital user is logged in
    const token = localStorage.getItem('hospitalToken');
    const user = localStorage.getItem('hospitalUser');
    const hospital = localStorage.getItem('hospitalData');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    try {
      setHospitalUser(JSON.parse(user));
      if (hospital) {
        setHospitalData(JSON.parse(hospital));
      }
    } catch (error) {
      console.error('Error parsing hospital user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading hospital panel...</p>
        </motion.div>
      </div>
    );
  }

  if (!hospitalUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        hospitalUser={hospitalUser}
        hospitalData={hospitalData || undefined}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          adminUser={hospitalUser}
        />

        {/* Page Content */}
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Breadcrumb />
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
