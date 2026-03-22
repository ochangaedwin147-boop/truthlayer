import { NextRequest, NextResponse } from 'next/server';
import { initiateMpesaSTKPush, createPendingPayment } from '@/lib/payment';

export async function POST(request: NextRequest) {
  try {
    const { email, plan, phone, method } = await request.json();

    // Validation
    if (!email || !plan || !method) {
      return NextResponse.json(
        { error: 'Email, plan, and payment method are required' },
        { status: 400 }
      );
    }

    // Plan pricing
    const planPrices: Record<string, { usd: number; kes: number }> = {
      starter: { usd: 9, kes: 1500 },
      pro: { usd: 29, kes: 4500 },
      enterprise: { usd: 99, kes: 15000 }
    };

    const pricing = planPrices[plan];
    if (!pricing) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (method === 'mpesa') {
      // M-Pesa STK Push
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required for M-Pesa payment' },
          { status: 400 }
        );
      }

      const amount = pricing.kes;
      const accountRef = `TL-${Date.now().toString(36).toUpperCase()}`;
      
      const result = await initiateMpesaSTKPush(
        phone,
        amount,
        accountRef,
        `TruthLayer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
      );

      if (result.success) {
        // Create pending payment record
        await createPendingPayment(
          email,
          plan as 'starter' | 'pro' | 'enterprise',
          'mpesa',
          amount,
          phone,
          result.merchantRequestId,
          result.checkoutRequestId
        );

        return NextResponse.json({
          success: true,
          message: 'Payment request sent to your phone. Please enter your M-Pesa PIN to complete.',
          checkoutRequestId: result.checkoutRequestId
        });
      } else {
        return NextResponse.json({
          error: result.error || 'Failed to initiate M-Pesa payment',
          errorCode: result.errorCode
        }, { status: 400 });
      }
    } else if (method === 'paypal') {
      // PayPal payment (for future implementation)
      return NextResponse.json({
        success: false,
        message: 'PayPal integration coming soon. Please use M-Pesa or contact support.',
        paypalEmail: 'ochangaedwin147@gmail.com',
        amount: pricing.usd,
        currency: 'USD'
      });
    } else if (method === 'bank') {
      // Bank transfer instructions
      return NextResponse.json({
        success: true,
        message: 'Please transfer to the following account:',
        bankDetails: {
          bank: 'Equity Bank Kenya',
          accountNumber: '0630182883708',
          accountName: 'TruthLayer',
          amount: pricing.kes,
          currency: 'KES',
          reference: `TL-${email.split('@')[0]}-${plan}`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
