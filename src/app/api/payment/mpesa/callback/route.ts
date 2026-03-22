import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// M-Pesa Callback Handler - Called automatically by Safaricom when payment completes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    // Extract callback data
    const { Body } = body;
    const { stkCallback } = Body || {};
    
    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Check if payment was successful
    const isSuccess = ResultCode === 0;

    if (isSuccess && CallbackMetadata?.Item) {
      // Extract payment details
      const metadata: Record<string, unknown> = {};
      CallbackMetadata.Item.forEach((item: { Name: string; Value?: unknown }) => {
        metadata[item.Name] = item.Value;
      });

      const amount = metadata.Amount as number;
      const mpesaReceiptNumber = metadata.MpesaReceiptNumber as string;
      const phoneNumber = metadata.PhoneNumber as string;

      console.log('Payment successful:', {
        amount,
        mpesaReceiptNumber,
        phoneNumber,
        merchantRequestId: MerchantRequestID
      });

      // Find the pending payment by checkout request ID
      const pendingPayment = await db.payment.findFirst({
        where: { checkoutRequestId: CheckoutRequestID }
      });

      if (pendingPayment) {
        // Update payment status
        await db.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: 'completed',
            transactionId: mpesaReceiptNumber,
            reference: mpesaReceiptNumber,
            rawResponse: JSON.stringify(body)
          }
        });

        // Find user and upgrade subscription
        const user = await db.user.findUnique({
          where: { email: pendingPayment.email }
        });

        if (user) {
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await db.subscription.upsert({
            where: { userId: user.id },
            update: {
              plan: pendingPayment.plan,
              status: 'active',
              currentPeriodEnd: periodEnd
            },
            create: {
              userId: user.id,
              plan: pendingPayment.plan,
              status: 'active',
              currentPeriodEnd: periodEnd
            }
          });

          console.log(`Subscription upgraded for user ${user.email} to ${pendingPayment.plan}`);
        }
      }
    } else {
      // Payment failed
      console.log('Payment failed:', ResultDesc);

      // Update payment status to failed
      await db.payment.updateMany({
        where: { checkoutRequestId: CheckoutRequestID },
        data: {
          status: 'failed',
          rawResponse: JSON.stringify(body)
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
