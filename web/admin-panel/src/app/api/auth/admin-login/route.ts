import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

// Add OPTIONS handler for CORS preflight (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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

    // Call user-service admin login endpoint (which has /api/v1 prefix)
    const loginUrl = `${API_CONFIG.USER_SERVICE_URL}${API_CONFIG.ENDPOINTS.ADMIN_LOGIN}`;
    console.log('Admin login - calling:', loginUrl);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    // Check response before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Admin login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try to get text
        const errorText = await response.text().catch(() => response.statusText);
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      
      console.error('Admin login failed:', response.status, errorMessage);
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    // Parse JSON only if response is ok
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing login response:', error);
      return NextResponse.json(
        { message: 'Invalid response from login service' },
        { status: 500 }
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

