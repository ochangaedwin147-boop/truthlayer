import { db } from './db';
import { PLANS, type PlanType } from './plans';

// Payment configuration - Sandbox test credentials
export const PAYMENT_CONFIG = {
  paypal: {
    email: 'ochangaedwin147@gmail.com',
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  },
  mpesa: {
    phone: '0741834315',
    // M-Pesa Daraja API credentials
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    // Sandbox test passkey (default for shortcode 174379)
    passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  },
  equity: {
    account: '0630182883708',
    bank: 'Equity Bank Kenya',
  },
  contactEmail: 'ochangaedwin147@gmail.com',
};

// Get M-Pesa access token
export async function getMpesaAccessToken(): Promise<string | null> {
  try {
    const { consumerKey, consumerSecret, environment } = PAYMENT_CONFIG.mpesa;
    
    if (!consumerKey || !consumerSecret) {
      console.error('M-Pesa credentials not configured');
      return null;
    }

    const baseUrl = environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    const data = await response.json();
    console.log('M-Pesa auth response:', data);
    return data.access_token || null;
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error);
    return null;
  }
}

// Initiate M-Pesa STK Push
export async function initiateMpesaSTKPush(
  phone: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<{ success: boolean; merchantRequestId?: string; checkoutRequestId?: string; error?: string; errorCode?: string }> {
  try {
    const accessToken = await getMpesaAccessToken();
    if (!accessToken) {
      return { success: false, error: 'Failed to get M-Pesa access token' };
    }

    const { shortcode, passkey, environment } = PAYMENT_CONFIG.mpesa;
    
    // Format phone number (remove leading 0 or +254 and add 254)
    let formattedPhone = phone.replace(/^0/, '254').replace(/^\+254/, '254');
    
    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const baseUrl = environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';

    const requestBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'https://truthlayer-pearl.vercel.app'}/api/payment/mpesa/callback`,
      AccountReference: accountReference.substring(0, 12),
      TransactionDesc: transactionDesc.substring(0, 13),
    };

    console.log('M-Pesa STK Push request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('M-Pesa STK Push response:', data);
    
    if (data.ResponseCode === '0') {
      return {
        success: true,
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
      };
    } else {
      return {
        success: false,
        error: data.errorMessage || data.ResponseDescription || 'STK Push failed',
        errorCode: data.errorCode || data.ResponseCode,
      };
    }
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return { success: false, error: 'Failed to initiate M-Pesa payment' };
  }
}

// Verify PayPal payment
export async function verifyPayPalPayment(transactionId: string): Promise<{ valid: boolean; amount?: number; currency?: string }> {
  try {
    // For now, return valid for demo
    return { valid: true, amount: 0, currency: 'USD' };
  } catch (error) {
    console.error('PayPal verification error:', error);
    return { valid: false };
  }
}

// Auto-upgrade user subscription after payment
export async function upgradeUserSubscription(
  email: string,
  plan: PlanType,
  paymentMethod: string,
  transactionId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check if payment already processed
    const existingPayment = transactionId ? await db.payment.findUnique({
      where: { transactionId },
    }) : null;

    if (existingPayment && existingPayment.status === 'completed') {
      return { success: false, error: 'Payment already processed' };
    }

    // Create or update payment record
    if (transactionId) {
      await db.payment.upsert({
        where: { transactionId },
        update: {
          status: 'completed',
          userId: user.id,
          rawResponse: JSON.stringify({ method: paymentMethod, amount }),
        },
        create: {
          email,
          userId: user.id,
          amount,
          currency: paymentMethod === 'mpesa' ? 'KES' : 'USD',
          plan,
          method: paymentMethod,
          status: 'completed',
          transactionId,
        },
      });
    }

    // Update subscription
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    await db.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan,
        status: 'active',
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId: user.id,
        plan,
        status: 'active',
        currentPeriodEnd: periodEnd,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to upgrade subscription:', error);
    return { success: false, error: 'Failed to upgrade subscription' };
  }
}

// Create pending payment
export async function createPendingPayment(
  email: string,
  plan: PlanType,
  method: string,
  amount: number,
  phone?: string,
  merchantRequestId?: string,
  checkoutRequestId?: string
): Promise<string> {
  const payment = await db.payment.create({
    data: {
      email,
      phone,
      amount,
      currency: method === 'mpesa' ? 'KES' : 'USD',
      plan,
      method,
      status: 'pending',
      merchantRequestId,
      checkoutRequestId,
    },
  });

  return payment.id;
}

// Update payment status
export async function updatePaymentStatus(
  checkoutRequestId: string,
  status: string,
  transactionId?: string,
  rawResponse?: string
): Promise<void> {
  await db.payment.updateMany({
    where: { checkoutRequestId },
    data: {
      status,
      transactionId,
      rawResponse,
    },
  });
}
