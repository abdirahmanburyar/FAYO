import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate username format (numbers only)
    if (!/^\d+$/.test(username)) {
      return NextResponse.json(
        { message: 'Username must contain only numbers' },
        { status: 400 }
      );
    }

    // Call user-service admin login endpoint
    const response = await fetch(`${API_CONFIG.USER_SERVICE_URL}${API_CONFIG.ENDPOINTS.ADMIN_LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Admin login failed' },
        { status: response.status }
      );
    }

    // Return admin token and user data
    return NextResponse.json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
