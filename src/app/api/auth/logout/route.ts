import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('session='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        deleteSession(token);
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
