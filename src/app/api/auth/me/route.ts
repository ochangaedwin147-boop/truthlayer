import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get subscription and API key
    const [subscription, apiKey] = await Promise.all([
      db.subscription.findUnique({
        where: { userId: user.id }
      }),
      db.apiKey.findUnique({
        where: { userId: user.id }
      })
    ]);

    // Get today's verification count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await db.verification.count({
      where: {
        userId: user.id,
        createdAt: { gte: today }
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
      } : null,
      apiKey: apiKey?.key || null,
      todayVerifications: todayCount
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
