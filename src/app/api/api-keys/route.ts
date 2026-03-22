import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateApiKey } from '@/lib/auth';

// Get API key
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const apiKey = await db.apiKey.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({
      apiKey: apiKey?.key || null,
      isActive: apiKey?.isActive || false,
      lastUsed: apiKey?.lastUsed || null
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Regenerate API key
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check subscription - only paid plans can regenerate
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id }
    });

    if (!subscription || subscription.plan === 'free') {
      return NextResponse.json(
        { error: 'API key regeneration requires a paid subscription' },
        { status: 403 }
      );
    }

    const newKey = generateApiKey();

    // Update or create API key
    await db.apiKey.upsert({
      where: { userId: user.id },
      update: { key: newKey },
      create: { key: newKey, userId: user.id }
    });

    return NextResponse.json({
      success: true,
      apiKey: newKey
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
