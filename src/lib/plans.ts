// Subscription plans configuration
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '5 verifications per day',
      'Basic AI analysis',
      'Chrome extension access',
      'Community support'
    ],
    limits: {
      dailyVerifications: 5,
      apiCalls: 0
    }
  },
  starter: {
    name: 'Starter',
    price: 9,
    priceId: 'price_starter_monthly',
    features: [
      '50 verifications per day',
      'Detailed AI analysis',
      'API access (1,000 calls/month)',
      'Priority support',
      'Verification history'
    ],
    limits: {
      dailyVerifications: 50,
      apiCalls: 1000
    }
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    features: [
      'Unlimited verifications',
      'Advanced AI analysis',
      'API access (10,000 calls/month)',
      'Priority support',
      'Full verification history',
      'Bulk analysis',
      'Custom flags'
    ],
    limits: {
      dailyVerifications: -1, // unlimited
      apiCalls: 10000
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    priceId: 'price_enterprise_monthly',
    features: [
      'Everything in Pro',
      'Unlimited API calls',
      'Dedicated support',
      'Custom integration',
      'SLA guarantee',
      'Team management',
      'White-label option'
    ],
    limits: {
      dailyVerifications: -1,
      apiCalls: -1
    }
  }
} as const;

export type PlanType = keyof typeof PLANS;

// Check if user can perform verification
export function canVerify(dailyCount: number, plan: PlanType): boolean {
  const limit = PLANS[plan].limits.dailyVerifications;
  return limit === -1 || dailyCount < limit;
}

// Get plan by price ID
export function getPlanByPriceId(priceId: string): PlanType | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return key as PlanType;
    }
  }
  return null;
}
