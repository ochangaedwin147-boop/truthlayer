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

// POST is disabled - payment required via /api/payment/initiate
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Payment required. Please use M-Pesa, PayPal, or bank transfer to upgrade your plan.' },
    { status: 402 }
  );
}
