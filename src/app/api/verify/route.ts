import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { analyzeText, getTrustLabel } from '@/lib/verification';
import { PLANS, canVerify, type PlanType } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Get subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id }
    });

    const plan = (subscription?.plan as PlanType) || 'free';

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await db.verification.count({
      where: {
        userId: user.id,
        createdAt: { gte: today }
      }
    });

    if (!canVerify(todayCount, plan)) {
      return NextResponse.json(
        { error: 'Daily verification limit reached. Please upgrade your plan.' },
        { status: 429 }
      );
    }

    // Analyze text
    const result = await analyzeText(content);
    const trustLabel = getTrustLabel(result.trustScore);

    // Save verification
    await db.verification.create({
      data: {
        userId: user.id,
        contentHash: result.contentHash,
        content: content.substring(0, 1000), // Store truncated content
        trustScore: result.trustScore,
        analysis: result.analysis,
        flags: JSON.stringify(result.flags)
      }
    });

    // Log usage
    await db.usageLog.create({
      data: {
        userId: user.id,
        action: 'verify_text'
      }
    });

    return NextResponse.json({
      success: true,
      result: {
        trustScore: result.trustScore,
        trustLabel: trustLabel.label,
        trustColor: trustLabel.color,
        trustDescription: trustLabel.description,
        analysis: result.analysis,
        flags: result.flags,
        contentHash: result.contentHash
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
