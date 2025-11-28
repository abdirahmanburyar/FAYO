import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    // Hardcode VPS IP address for specialty-service (always use external IP, not Docker service name)
    const specialtyServiceUrl = 'http://31.97.58.62:3004';
    const url = `${specialtyServiceUrl}${API_CONFIG.ENDPOINTS.SPECIALTIES}${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying GET specialties request to:', url);
    console.log('SPECIALTY_SERVICE_URL:', specialtyServiceUrl);
    
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
      let errorMessage = 'Failed to fetch specialties';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      console.error('Specialty service error:', response.status, errorMessage);
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying specialties request:', error);
    const specialtyServiceUrl = process.env.SPECIALTY_SERVICE_URL || 'http://31.97.58.62:3004';
      const errorMessage = error.name === 'AbortError' 
      ? 'Request timeout - specialty-service may be unreachable'
      : error.message || 'Internal server error';
    return NextResponse.json(
      { 
        message: errorMessage,
        error: error.message,
        details: `Unable to reach ${specialtyServiceUrl}${API_CONFIG.ENDPOINTS.SPECIALTIES}`
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Hardcode VPS IP address for specialty-service (always use external IP, not Docker service name)
    const specialtyServiceUrl = 'http://31.97.58.62:3004';
    const url = `${specialtyServiceUrl}${API_CONFIG.ENDPOINTS.SPECIALTIES}`;
    
    console.log('Proxying POST specialties request to:', url);
    
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
      let errorMessage = 'Failed to create specialty';
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
    console.error('Error proxying specialties POST request:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

