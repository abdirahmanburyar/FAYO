'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  href: string;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Admin', href: '/admin' }
    ];

    if (pathSegments.length === 1) {
      return breadcrumbs;
    }

    // Map path segments to readable names
    const segmentMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'hospitals': 'Hospitals',
      'users': 'Users',
      'doctors': 'Doctors',
      'appointments': 'Appointments',
      'reports': 'Reports',
      'settings': 'Settings',
    };

    let currentPath = '/admin';
    
    for (let i = 1; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      
      // Skip dynamic segments (like [id])
      if (segment.startsWith('[') && segment.endsWith(']')) {
        continue;
      }

      const name = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ name, href: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link 
        href="/admin/dashboard" 
        className="flex items-center hover:text-blue-600 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        Admin
      </Link>
      
      {breadcrumbs.slice(1).map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{breadcrumb.name}</span>
          ) : (
            <Link 
              href={breadcrumb.href}
              className="hover:text-blue-600 transition-colors"
            >
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
