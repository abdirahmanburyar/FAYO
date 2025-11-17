import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const baseUrl = API_CONFIG.CALL_SERVICE_URL || process.env.NEXT_PUBLIC_CALL_SERVICE_URL || '';

export type CallType = 'VIDEO' | 'VOICE';

export interface CallSession {
  id: string;
  channelName: string;
  initiatorId: string;
  recipientId?: string;
  callType: CallType;
  status: string;
}

export interface CallCredential {
  sdkKey: string;
  token: string;
  sessionName: string;
  channelName: string; // Backward compatibility
  userIdentity: string;
  rtcUserId: string; // Backward compatibility
  expiresAt: string;
  expiresIn: number;
  role: 'HOST' | 'PARTICIPANT';
}

export async function createCallSession(
  accessToken: string,
  recipientId: string,
  callType: CallType = 'VIDEO',
): Promise<{ session: CallSession; credential: CallCredential }> {
  if (!baseUrl) throw new Error('CALL_SERVICE_URL is not configured');

  const response = await axios.post(
    `${baseUrl}/api/v1/calls/session`,
    { recipientId, callType },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}

export async function requestCallToken(
  accessToken: string,
  sessionId: string,
  role: 'HOST' | 'AUDIENCE' = 'HOST',
): Promise<{ session: CallSession; credential: CallCredential }> {
  if (!baseUrl) throw new Error('CALL_SERVICE_URL is not configured');

  const response = await axios.post(
    `${baseUrl}/api/v1/calls/session/${sessionId}/token`,
    { role },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}


