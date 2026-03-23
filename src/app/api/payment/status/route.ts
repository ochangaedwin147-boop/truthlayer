import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'Missing checkoutRequestId' }, { status: 400 });
    }

    // Find the payment
    const payment = await db.payment.findFirst({
      where: { checkoutRequestId }
    });

    if (!payment) {
      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json({ 
      status: payment.status,
      transactionId: payment.transactionId 
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
