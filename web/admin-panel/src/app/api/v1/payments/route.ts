import { NextRequest, NextResponse } from 'next/server';

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
    // Hardcode VPS IP address for payment-service
    const paymentServiceUrl = 'http://31.97.58.62:3006';
    const url = `${paymentServiceUrl}/api/v1/payments${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying GET payments request to:', url);
    
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
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch payments';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      console.error('Payment service error:', response.status, errorMessage);
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying payments request:', error);
    const paymentServiceUrl = 'http://31.97.58.62:3006';
    const errorMessage = error.name === 'AbortError' 
      ? 'Request timeout - payment-service may be unreachable'
      : error.message || 'Internal server error';
    return NextResponse.json(
      { 
        message: errorMessage,
        error: error.message,
        details: `Unable to reach ${paymentServiceUrl}/api/v1/payments`
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Hardcode VPS IP address for payment-service
    const paymentServiceUrl = 'http://31.97.58.62:3006';
    const url = `${paymentServiceUrl}/api/v1/payments`;
    
    console.log('Proxying POST payments request to:', url);
    
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
      let errorMessage = 'Failed to create payment';
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
    console.error('Error proxying payments POST request:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

