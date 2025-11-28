import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying GET hospitals request to:', url);
    console.log('HOSPITAL_SERVICE_URL:', API_CONFIG.HOSPITAL_SERVICE_URL);
    
    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch hospitals';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      console.error('Hospital service error:', response.status, errorMessage);
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying hospitals request:', error);
    const errorMessage = error.name === 'AbortError' 
      ? 'Request timeout - hospital-service may be unreachable'
      : error.message || 'Internal server error';
    return NextResponse.json(
      { 
        message: errorMessage,
        error: error.message,
        details: `Unable to reach ${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}`
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${API_CONFIG.HOSPITAL_SERVICE_URL}${API_CONFIG.ENDPOINTS.HOSPITALS}`;
    
    console.log('Proxying POST hospitals request to:', url);
    
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create hospital';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying hospitals POST request:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

