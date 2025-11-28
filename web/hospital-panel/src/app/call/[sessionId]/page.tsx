'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { requestCallToken } from '@/services/callApi';
import CallPageContent from './CallPageContent';

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<any>(null);

  // Load credentials
  useEffect(() => {
    if (!appointmentId) {
      setError('Appointment ID is required');
      setLoading(false);
      return;
    }

    const loadCredentials = async () => {
      try {
        setLoading(true);
        
        // Get admin user ID from localStorage
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
          throw new Error('Not authenticated');
        }
        
        let adminUserId: string;
        try {
          const userData = JSON.parse(adminUser);
          adminUserId = userData.id || userData.userId;
        } catch {
          throw new Error('Invalid user data');
        }

        // Request call credentials
        const response = await requestCallToken(appointmentId, adminUserId, 'HOST');
        setCredential(response.credential);
        setLoading(false);
      } catch (e) {
        console.error('❌ [CALL] Failed to load credentials:', e);
        const errorMessage = e instanceof Error 
          ? e.message 
          : typeof e === 'object' && e !== null
          ? JSON.stringify(e, Object.getOwnPropertyNames(e))
          : String(e) || 'Failed to load call credentials';
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadCredentials();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading call...</p>
        </div>
      </div>
    );
  }

  if (error || !credential) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center bg-gray-900 p-8 rounded-lg max-w-md">
          <p className="text-red-500 text-lg mb-4">{error || 'Failed to load call credentials'}</p>
          <button
            onClick={() => router.push('/admin/appointments')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <CallPageContent appointmentId={appointmentId} credential={credential} />;
}
