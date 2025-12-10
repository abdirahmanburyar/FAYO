import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

// Input sanitization helper
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Validate input length
function validateInputLength(input: string, maxLength: number = 100): boolean {
  return input.length > 0 && input.length <= maxLength;
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Validate input exists
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const sanitizedUsername = sanitizeInput(String(username));
    const sanitizedPassword = sanitizeInput(String(password));

    if (!validateInputLength(sanitizedUsername, 50) || !validateInputLength(sanitizedPassword, 200)) {
      return NextResponse.json(
        { message: 'Invalid input length' },
        { status: 400 }
      );
    }

    // Validate username format (numbers only)
    if (!/^\d+$/.test(sanitizedUsername)) {
      return NextResponse.json(
        { message: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Call user-service admin login endpoint
    const loginUrl = `${API_CONFIG.USER_SERVICE_URL}${API_CONFIG.ENDPOINTS.ADMIN_LOGIN}`;
    // Don't log sensitive information
    
    let response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: sanitizedUsername,
          password: sanitizedPassword,
        }),
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (fetchError: any) {
      // Don't expose internal errors in production
      const isTimeout = fetchError.name === 'AbortError';
      return NextResponse.json(
        { 
          message: isTimeout 
            ? 'Service temporarily unavailable. Please try again later.'
            : 'Authentication service unavailable'
        },
        { status: 503 }
      );
    }

    // Check response before parsing JSON
    if (!response.ok) {
      // Generic error message to prevent information leakage
      const errorMessage = response.status === 401 
        ? 'Invalid credentials'
        : 'Authentication failed';
      
      return NextResponse.json(
        { message: errorMessage },
        { status: 401 }
      );
    }

    // Parse JSON only if response is ok
    let data;
    try {
      data = await response.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Authentication service error' },
        { status: 500 }
      );
    }

    // Validate response data
    if (!data.accessToken) {
      return NextResponse.json(
        { message: 'Invalid authentication response' },
        { status: 500 }
      );
    }

    // Create response with secure cookie
    const responseData = NextResponse.json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });

    // Set secure HTTP-only cookie for token (additional security layer)
    if (data.accessToken) {
      responseData.cookies.set('adminToken', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return responseData;

  } catch (error: any) {
    // Don't expose error details in production
    return NextResponse.json(
      { 
        message: 'An error occurred during authentication'
      },
      { status: 500 }
    );
  }
}

