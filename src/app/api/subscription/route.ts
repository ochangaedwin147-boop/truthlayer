import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { PLANS, type PlanType } from '@/lib/plans';

// Get subscription info
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id }
    });

    if (!subscription) {
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        planDetails: PLANS.free
      });
    }

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      planDetails: PLANS[subscription.plan as PlanType] || PLANS.free
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update subscription (would normally integrate with Stripe)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { plan } = await request.json();

    if (!plan || !PLANS[plan as PlanType]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // In production, this would integrate with Stripe
    // For now, we'll just update the subscription directly
    const subscription = await db.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      create: {
        userId: user.id,
        plan,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
