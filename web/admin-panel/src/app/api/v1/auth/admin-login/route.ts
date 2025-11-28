import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

// Add OPTIONS handler for CORS preflight
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

    // Call user-service admin login endpoint
    const loginUrl = `${API_CONFIG.USER_SERVICE_URL}${API_CONFIG.ENDPOINTS.ADMIN_LOGIN}`;
    console.log('Admin login - calling:', loginUrl);
    console.log('USER_SERVICE_URL env:', process.env.USER_SERVICE_URL);
    console.log('API_CONFIG.USER_SERVICE_URL:', API_CONFIG.USER_SERVICE_URL);
    
    let response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      const errorMessage = fetchError.name === 'AbortError' 
        ? 'Request timeout - user-service may be unreachable'
        : fetchError.message || 'Failed to connect to user-service';
      return NextResponse.json(
        { 
          message: errorMessage,
          details: `Unable to reach ${loginUrl}. Check if user-service is running and accessible.`,
          error: fetchError.message 
        },
        { status: 503 }
      );
    }

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

  } catch (error: any) {
    console.error('Admin login error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

