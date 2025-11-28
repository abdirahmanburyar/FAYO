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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const specialtyServiceUrl = process.env.SPECIALTY_SERVICE_URL || 'http://specialty-service:3004';
    const url = `${specialtyServiceUrl}/api/v1/specialties/${params.id}`;
    console.log('Proxying GET specialty request to:', url);
    
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
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch specialty';
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
    console.error('Error proxying specialty GET request:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const specialtyServiceUrl = process.env.SPECIALTY_SERVICE_URL || 'http://specialty-service:3004';
    const url = `${specialtyServiceUrl}/api/v1/specialties/${params.id}`;
    console.log('Proxying PATCH specialty request to:', url);
    
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update specialty';
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
    console.error('Error proxying specialty PATCH request:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const specialtyServiceUrl = process.env.SPECIALTY_SERVICE_URL || 'http://specialty-service:3004';
    const url = `${specialtyServiceUrl}/api/v1/specialties/${params.id}`;
    console.log('Proxying DELETE specialty request to:', url);
    
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete specialty';
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

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error proxying specialty DELETE request:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        error: error.message
      },
      { status: 500 }
    );
  }
}

