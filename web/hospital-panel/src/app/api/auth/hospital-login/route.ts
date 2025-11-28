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

    // Call user-service hospital-login endpoint
    const loginUrl = `${API_CONFIG.USER_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITAL_LOGIN}`;
    console.log('Hospital login - calling:', loginUrl);
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!loginResponse.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await loginResponse.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try to get text
        const errorText = await loginResponse.text().catch(() => loginResponse.statusText);
        errorMessage = errorText || `HTTP ${loginResponse.status}`;
      }
      
      console.error('Hospital login failed:', loginResponse.status, errorMessage);
      return NextResponse.json(
        { message: errorMessage },
        { status: loginResponse.status }
      );
    }

    // Parse JSON only if response is ok
    let loginData;
    try {
      loginData = await loginResponse.json();
    } catch (error) {
      console.error('Error parsing login response:', error);
      return NextResponse.json(
        { message: 'Invalid response from login service' },
        { status: 500 }
      );
    }

    // Return token, user data, and hospital data
    return NextResponse.json({
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
      user: loginData.user,
      hospital: loginData.hospital,
    });

  } catch (error) {
    console.error('Hospital login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

