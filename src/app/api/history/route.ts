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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const verifications = await db.verification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        contentHash: true,
        content: true,
        trustScore: true,
        analysis: true,
        flags: true,
        createdAt: true
      }
    });

    const total = await db.verification.count({
      where: { userId: user.id }
    });

    return NextResponse.json({
      verifications: verifications.map(v => ({
        ...v,
        flags: v.flags ? JSON.parse(v.flags) : []
      })),
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
