'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, 
  Eye, Key, History, CreditCard, LogOut, Menu, X,
  Zap, Globe, Lock, TrendingUp, Users, Sparkles,
  Copy, RefreshCw, ChevronRight, Clock, AlertCircle,
  Smartphone, Building2, Wallet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Types
interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Subscription {
  plan: string;
  status: string;
}

interface VerificationResult {
  trustScore: number;
  trustLabel: string;
  trustColor: string;
  trustDescription: string;
  analysis: string;
  flags: string[];
  contentHash: string;
}

interface VerificationHistory {
  id: string;
  contentHash: string;
  content: string;
  trustScore: number;
  analysis: string;
  flags: string[];
  createdAt: string;
}

interface AuthState {
  user: User | null;
  apiKey: string | null;
  subscription: Subscription | null;
  todayVerifications: number;
  isLoading: boolean;
}

// Plans configuration with KES prices
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceKES: 0,
    features: ['5 verifications per day', 'Basic AI analysis', 'Chrome extension access', 'Community support'],
    color: 'gray'
  },
  starter: {
    name: 'Starter',
    price: 9,
    priceKES: 1500,
    features: ['50 verifications per day', 'Detailed AI analysis', 'API access (1,000 calls/month)', 'Priority support', 'Verification history'],
    color: 'blue'
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceKES: 4500,
    features: ['Unlimited verifications', 'Advanced AI analysis', 'API access (10,000 calls/month)', 'Priority support', 'Full verification history', 'Bulk analysis', 'Custom flags'],
    color: 'purple'
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    priceKES: 15000,
    features: ['Everything in Pro', 'Unlimited API calls', 'Dedicated support', 'Custom integration', 'SLA guarantee', 'Team management', 'White-label option'],
    color: 'gold'
  }
};

export default function Home() {
  const [auth, setAuth] = useState<AuthState>({ user: null, apiKey: null, subscription: null, todayVerifications: 0, isLoading: true });
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Auth forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Verification
  const [content, setContent] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  // History
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Pricing dialog
  const [pricingOpen, setPricingOpen] = useState(false);
  
  // Payment state
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paypal' | 'bank' | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'pay' | 'processing' | 'success'>('select');

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAuth({
            user: data.user,
            apiKey: data.apiKey,
            subscription: data.subscription,
            todayVerifications: data.todayVerifications,
            isLoading: false
          });
          setView('dashboard');
        } else {
          setAuth(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, password: signupPassword, name: signupName })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(prev => ({
          ...prev,
          user: data.user,
          apiKey: data.apiKey
        }));
        setView('dashboard');
        toast({ title: 'Account created!', description: 'Welcome to TruthLayer!' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create account', variant: 'destructive' });
    }
    setAuthLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(prev => ({
          ...prev,
          user: data.user,
          apiKey: data.apiKey
        }));
        setView('dashboard');
        toast({ title: 'Welcome back!', description: 'Logged in successfully' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to login', variant: 'destructive' });
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuth({ user: null, apiKey: null, subscription: null, todayVerifications: 0, isLoading: false });
    setView('landing');
    setResult(null);
    setContent('');
    setHistory([]);
  };

  const handleVerify = async () => {
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter content to verify', variant: 'destructive' });
      return;
    }
    
    setVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
        setAuth(prev => ({ ...prev, todayVerifications: prev.todayVerifications + 1 }));
        toast({ title: 'Analysis Complete', description: `Trust Score: ${data.result.trustScore}/100` });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to verify content', variant: 'destructive' });
    }
    setVerifying(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/history?limit=20');
      const data = await res.json();
      if (res.ok) {
        setHistory(data.verifications);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load history', variant: 'destructive' });
    }
    setHistoryLoading(false);
  };

  const regenerateApiKey = async () => {
    try {
      const res = await fetch('/api/api-keys', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAuth(prev => ({ ...prev, apiKey: data.apiKey }));
        toast({ title: 'API Key Regenerated', description: 'Your new API key is ready' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to regenerate API key', variant: 'destructive' });
    }
  };

  const copyApiKey = () => {
    if (auth.apiKey) {
      navigator.clipboard.writeText(auth.apiKey);
      toast({ title: 'Copied!', description: 'API key copied to clipboard' });
    }
  };

  // Payment handler
  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod) {
      toast({ title: 'Error', description: 'Please select a plan and payment method', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'mpesa' && !mpesaPhone.trim()) {
      toast({ title: 'Error', description: 'Please enter your M-Pesa phone number', variant: 'destructive' });
      return;
    }

    setPaymentLoading(true);
    setPaymentStep('processing');

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.user?.email,
          plan: selectedPlan,
          method: paymentMethod,
          phone: paymentMethod === 'mpesa' ? mpesaPhone : undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (paymentMethod === 'mpesa') {
          setPaymentStatus(data.message);
          toast({ 
            title: 'Payment Request Sent!', 
            description: 'Check your phone for M-Pesa prompt and enter your PIN to complete payment.' 
          });
          // Start polling for payment status
          pollPaymentStatus(data.checkoutRequestId);
        } else if (paymentMethod === 'bank') {
          setPaymentStatus(`Bank Transfer Details:\nBank: ${data.bankDetails.bank}\nAccount: ${data.bankDetails.accountNumber}\nAmount: KES ${data.bankDetails.amount}\nReference: ${data.bankDetails.reference}`);
        }
      } else {
        setPaymentStep('pay');
        toast({ title: 'Payment Failed', description: data.error || 'Failed to initiate payment', variant: 'destructive' });
      }
    } catch {
      setPaymentStep('pay');
      toast({ title: 'Error', description: 'Failed to process payment', variant: 'destructive' });
    }
    setPaymentLoading(false);
  };

  // Poll for payment status
  const pollPaymentStatus = async (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus('Payment timeout. Please contact support if you completed payment.');
        return;
      }

      try {
        const res = await fetch(`/api/payment/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await res.json();

        if (data.status === 'completed') {
          setPaymentStep('success');
          setAuth(prev => ({
            ...prev,
            subscription: { plan: selectedPlan!, status: 'active' }
          }));
          toast({ title: 'Payment Successful!', description: 'Your plan has been upgraded!' });
          return;
        } else if (data.status === 'failed') {
          setPaymentStep('pay');
          setPaymentStatus('Payment failed. Please try again.');
          return;
        }

        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch {
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  const resetPaymentDialog = () => {
    setSelectedPlan(null);
    setPaymentMethod(null);
    setMpesaPhone('');
    setPaymentStatus(null);
    setPaymentStep('select');
  };

  const openPaymentDialog = (planKey: string) => {
    if (!auth.user) {
      toast({ title: 'Please Login', description: 'You need to login first to upgrade your plan', variant: 'destructive' });
      return;
    }
    if (auth.subscription?.plan === planKey) {
      toast({ title: 'Already on this plan', description: 'You are already subscribed to this plan' });
      return;
    }
    if (planKey === 'free') {
      toast({ title: 'Cannot downgrade', description: 'To downgrade to free plan, cancel your current subscription' });
      return;
    }
    setSelectedPlan(planKey);
    setPaymentStep('select');
    setPricingOpen(true);
  };

  const getDailyLimit = () => {
    const plan = auth.subscription?.plan || 'free';
    if (plan === 'free') return 5;
    if (plan === 'starter') return 50;
    return -1; // unlimited
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="w-16 h-16 text-emerald-500" />
          <span className="text-slate-400">Loading TruthLayer...</span>
        </div>
      </div>
    );
  }

  // Landing Page
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-500" />
              <span className="text-xl font-bold">TruthLayer</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild><Button variant="ghost">Login</Button></DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader><DialogTitle>Login to TruthLayer</DialogTitle></DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div><Label>Email</Label><Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                    <div><Label>Password</Label><Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>{authLoading ? 'Logging in...' : 'Login'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button></DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader><DialogTitle>Create your account</DialogTitle></DialogHeader>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div><Label>Name (optional)</Label><Input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                    <div><Label>Email</Label><Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                    <div><Label>Password (min 6 characters)</Label><Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>{authLoading ? 'Creating...' : 'Create Account'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Sparkles className="w-3 h-3 mr-1" /> AI-Powered Misinformation Detection</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">Detect Fake Content Instantly</h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">TruthLayer uses advanced AI to verify any content in seconds. Get trust scores, detailed analysis, and warning flags.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog>
              <DialogTrigger asChild><Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">Start Free Trial <ChevronRight className="w-5 h-5 ml-1" /></Button></DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader><DialogTitle>Create your account</DialogTitle></DialogHeader>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div><Label>Name (optional)</Label><Input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                  <div><Label>Email</Label><Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                  <div><Label>Password (min 6 characters)</Label><Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>{authLoading ? 'Creating...' : 'Create Account'}</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button size="lg" variant="outline" className="border-slate-600 hover:bg-slate-800 text-lg px-8" onClick={() => setPricingOpen(true)}>View Pricing</Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="w-8 h-8" />, title: 'AI-Powered Analysis', desc: 'Detects misinformation patterns, bias, and unreliable claims with high accuracy.' },
              { icon: <Zap className="w-8 h-8" />, title: 'Instant Results', desc: 'Get trust scores and detailed analysis in seconds.' },
              { icon: <Globe className="w-8 h-8" />, title: 'Works Everywhere', desc: 'Chrome extension, web app, or API - verify content from any source.' },
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors">
                <CardHeader><div className="text-emerald-500 mb-2">{feature.icon}</div><CardTitle className="text-lg">{feature.title}</CardTitle></CardHeader>
                <CardContent><p className="text-slate-400">{feature.desc}</p></CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 text-center mb-12">Start free, upgrade when you need more</p>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Object.entries(PLANS).map(([key, plan]) => (
              <Card key={key} className={`bg-slate-800/50 border-slate-700 ${key === 'pro' ? 'border-emerald-500 relative' : ''}`}>
                {key === 'pro' && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-emerald-500">Most Popular</Badge></div>}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">${plan.price}<span className="text-lg text-slate-400">/mo</span></div>
                  {plan.priceKES > 0 && <div className="text-sm text-slate-500">~KES {plan.priceKES.toLocaleString()}</div>}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">{plan.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{f}</li>)}</ul>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild><Button className={`w-full ${key === 'pro' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}>Get Started</Button></DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white">
                      <DialogHeader><DialogTitle>Create your account</DialogTitle></DialogHeader>
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div><Label>Email</Label><Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                        <div><Label>Password (min 6 characters)</Label><Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required /></div>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>{authLoading ? 'Creating...' : 'Create Account'}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-700/50 py-8 text-center text-slate-400">
          <div className="flex items-center justify-center gap-2 mb-4"><Shield className="w-6 h-6 text-emerald-500" /><span className="font-bold text-white">TruthLayer</span></div>
          <p className="text-sm">AI-powered misinformation detection. Created by Edwin McCain.</p>
          <p className="text-sm mt-2">&copy; {new Date().getFullYear()} TruthLayer. All rights reserved.</p>
        </footer>

        {/* Landing Pricing Dialog */}
        <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
            <DialogHeader><DialogTitle>Choose Your Plan</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(PLANS).map(([key, plan]) => (
                <Card key={key} className={`bg-slate-700/50 border-slate-600 ${key === 'pro' ? 'border-emerald-500' : ''}`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold">${plan.price}/mo</div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">{plan.features.slice(0, 4).map((f, i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{f}</li>)}</ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield className="w-7 h-7 text-emerald-500" /><span className="text-xl font-bold">TruthLayer</span></div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">{auth.subscription?.plan?.toUpperCase() || 'FREE'}</Badge>
            <div className="hidden sm:block text-sm text-slate-400">{auth.user?.email}</div>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="verify" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="verify" className="data-[state=active]:bg-emerald-600"><Eye className="w-4 h-4 mr-2" /> Verify</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600" onClick={loadHistory}><History className="w-4 h-4 mr-2" /> History</TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-emerald-600"><Key className="w-4 h-4 mr-2" /> API</TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:bg-emerald-600"><CreditCard className="w-4 h-4 mr-2" /> Plan</TabsTrigger>
          </TabsList>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Today's Verifications</p>
                    <p className="text-2xl font-bold">{auth.todayVerifications}{getDailyLimit() > 0 && <span className="text-slate-400 text-lg"> / {getDailyLimit()}</span>}{getDailyLimit() === -1 && <span className="text-emerald-400 text-sm ml-2">(Unlimited)</span>}</p>
                  </div>
                  {getDailyLimit() > 0 && <div className="flex-1 max-w-xs"><Progress value={(auth.todayVerifications / getDailyLimit()) * 100} className="h-2" /></div>}
                  <Button variant="outline" onClick={() => setPricingOpen(true)}>Upgrade Plan</Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-emerald-500" />Content to Verify</CardTitle></CardHeader>
                <CardContent><Textarea placeholder="Paste your content here..." className="min-h-[300px] bg-slate-700 border-slate-600 resize-none" value={content} onChange={(e) => setContent(e.target.value)} /></CardContent>
                <CardFooter><Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleVerify} disabled={verifying || !content.trim}>{verifying ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Shield className="w-4 h-4 mr-2" />Verify Content</>}</Button></CardFooter>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-500" />Verification Result</CardTitle></CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-700" />
                            <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray={`${(result.trustScore / 100) * 352} 352`} className={result.trustColor === 'green' ? 'text-green-500' : result.trustColor === 'lime' ? 'text-lime-500' : result.trustColor === 'yellow' ? 'text-yellow-500' : result.trustColor === 'orange' ? 'text-orange-500' : 'text-red-500'} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center"><div><div className="text-3xl font-bold">{result.trustScore}</div><div className="text-xs text-slate-400">/ 100</div></div></div>
                        </div>
                        <Badge className={`mt-2 ${result.trustColor === 'green' ? 'bg-green-500' : result.trustColor === 'lime' ? 'bg-lime-500' : result.trustColor === 'yellow' ? 'bg-yellow-500' : result.trustColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'} text-white`}>{result.trustLabel}</Badge>
                        <p className="text-sm text-slate-400 mt-2">{result.trustDescription}</p>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div><h4 className="font-semibold mb-2">Analysis</h4><p className="text-sm text-slate-300 whitespace-pre-wrap">{result.analysis}</p></div>
                      {result.flags.length > 0 && <div><h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" />Warning Flags</h4><div className="flex flex-wrap gap-2">{result.flags.map((flag, i) => <Badge key={i} variant="outline" className="border-yellow-500/50 text-yellow-400">{flag}</Badge>)}</div></div>}
                    </div>
                  ) : <div className="text-center py-12 text-slate-400"><Shield className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Verify content to see results</p></div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-emerald-500" />Verification History</CardTitle></CardHeader>
              <CardContent>
                {historyLoading ? <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div> : history.length === 0 ? <div className="text-center py-8 text-slate-400"><History className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No verification history yet</p></div> : <ScrollArea className="h-[400px]"><div className="space-y-4">{history.map((item) => <Card key={item.id} className="bg-slate-700/50 border-slate-600"><CardContent className="py-4"><div className="flex items-start justify-between gap-4"><div className="flex-1"><p className="text-sm text-slate-300 line-clamp-2">{item.content}</p><div className="flex items-center gap-2 mt-2"><Clock className="w-3 h-3 text-slate-500" /><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span></div></div><div className="text-center shrink-0"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${item.trustScore >= 60 ? 'bg-green-500/20 text-green-400' : item.trustScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{item.trustScore}</div></div></div></CardContent></Card>)}</div></ScrollArea>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-emerald-500" />API Access</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {auth.subscription?.plan === 'free' ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400">Upgrade to a paid plan to get full API access.</p>
                    <Button className="mt-4" onClick={() => setPricingOpen(true)}>Upgrade Now</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div><Label>Your API Key</Label><div className="flex gap-2 mt-1"><Input value={auth.apiKey || ''} readOnly className="bg-slate-700 border-slate-600 font-mono" /><Button variant="outline" onClick={copyApiKey}><Copy className="w-4 h-4" /></Button><Button variant="outline" onClick={regenerateApiKey}><RefreshCw className="w-4 h-4" /></Button></div></div>
                    <Separator className="bg-slate-700" />
                    <div><Label>API Endpoint</Label><code className="block bg-slate-700 p-2 rounded mt-1 text-sm">POST /api/verify</code></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500" />Your Subscription</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <Card key={key} className={`bg-slate-700/50 border-slate-600 ${auth.subscription?.plan === key ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`}>
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="text-2xl font-bold">${plan.price}/mo</div>
                        {plan.priceKES > 0 && <div className="text-sm text-slate-500">KES {plan.priceKES.toLocaleString()}</div>}
                      </CardHeader>
                      <CardContent className="text-sm">
                        <ul className="space-y-1 mb-4">{plan.features.slice(0, 4).map((f, i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{f}</li>)}</ul>
                        {auth.subscription?.plan === key ? <Button className="w-full" disabled>Current Plan</Button> : <Button className="w-full" variant={key === 'pro' ? 'default' : 'outline'} onClick={() => openPaymentDialog(key)}>{plan.price === 0 ? 'Downgrade' : 'Upgrade'}</Button>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Dialog */}
      <Dialog open={pricingOpen} onOpenChange={(open) => { setPricingOpen(open); if (!open) resetPaymentDialog(); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{paymentStep === 'success' ? '✅ Payment Successful!' : paymentStep === 'processing' ? '⏳ Processing Payment...' : 'Upgrade Your Plan'}</DialogTitle>
            {selectedPlan && PLANS[selectedPlan as keyof typeof PLANS] && paymentStep !== 'success' && (
              <DialogDescription className="text-slate-400">
                {PLANS[selectedPlan as keyof typeof PLANS].name} Plan - ${PLANS[selectedPlan as keyof typeof PLANS].price}/mo (KES {PLANS[selectedPlan as keyof typeof PLANS].priceKES.toLocaleString()})
              </DialogDescription>
            )}
          </DialogHeader>

          {paymentStep === 'select' && (
            <div className="space-y-4">
              <Label>Select Payment Method</Label>
              <div className="grid gap-3">
                <Button variant="outline" className={`h-auto py-4 justify-start ${paymentMethod === 'mpesa' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'}`} onClick={() => { setPaymentMethod('mpesa'); setPaymentStep('pay'); }}>
                  <Smartphone className="w-6 h-6 mr-3 text-green-500" />
                  <div className="text-left"><div className="font-semibold">M-Pesa</div><div className="text-xs text-slate-400">Pay with Safaricom M-Pesa</div></div>
                </Button>
                <Button variant="outline" className={`h-auto py-4 justify-start ${paymentMethod === 'paypal' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'}`} onClick={() => { setPaymentMethod('paypal'); setPaymentStep('pay'); }}>
                  <Wallet className="w-6 h-6 mr-3 text-blue-500" />
                  <div className="text-left"><div className="font-semibold">PayPal</div><div className="text-xs text-slate-400">Pay with PayPal account</div></div>
                </Button>
                <Button variant="outline" className={`h-auto py-4 justify-start ${paymentMethod === 'bank' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'}`} onClick={() => { setPaymentMethod('bank'); setPaymentStep('pay'); }}>
                  <Building2 className="w-6 h-6 mr-3 text-yellow-500" />
                  <div className="text-left"><div className="font-semibold">Bank Transfer</div><div className="text-xs text-slate-400">Equity Bank Kenya</div></div>
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'pay' && (
            <div className="space-y-4">
              {paymentMethod === 'mpesa' && (
                <div className="space-y-4">
                  <div>
                    <Label>M-Pesa Phone Number</Label>
                    <Input placeholder="0712345678 or 254712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className="bg-slate-700 border-slate-600 mt-1" />
                    <p className="text-xs text-slate-500 mt-1">You will receive an STK Push on this number</p>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded text-sm">
                    <p className="font-semibold">Amount: KES {selectedPlan && PLANS[selectedPlan as keyof typeof PLANS]?.priceKES.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Your account will be upgraded automatically after payment</p>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handlePayment} disabled={paymentLoading || !mpesaPhone}>
                    {paymentLoading ? 'Processing...' : 'Pay with M-Pesa'}
                  </Button>
                </div>
              )}
              {paymentMethod === 'paypal' && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded">
                    <p className="text-blue-400 font-semibold mb-2">PayPal Payment</p>
                    <p className="text-sm text-slate-300">Send payment to:</p>
                    <code className="block bg-slate-700 p-2 rounded mt-1 text-sm">ochangaedwin147@gmail.com</code>
                    <p className="text-sm text-slate-300 mt-2">Amount: ${selectedPlan && PLANS[selectedPlan as keyof typeof PLANS]?.price} USD</p>
                    <p className="text-xs text-slate-400 mt-2">After payment, send screenshot to support for manual verification.</p>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => window.open('https://paypal.me/ochangaedwin147', '_blank')}>Open PayPal</Button>
                </div>
              )}
              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded">
                    <p className="text-yellow-400 font-semibold mb-2">Equity Bank Kenya</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-slate-400">Account Name:</span> TruthLayer</p>
                      <p><span className="text-slate-400">Account Number:</span> 0630182883708</p>
                      <p><span className="text-slate-400">Amount:</span> KES {selectedPlan && PLANS[selectedPlan as keyof typeof PLANS]?.priceKES.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">After payment, send receipt to support for manual verification.</p>
                  </div>
                </div>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setPaymentStep('select')}>← Back to payment methods</Button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-emerald-500 mb-4" />
              <p className="text-lg font-semibold">Processing Payment...</p>
              <p className="text-sm text-slate-400 mt-2">{paymentStatus || 'Please check your phone for M-Pesa prompt and enter your PIN'}</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
              <p className="text-lg font-semibold">Payment Successful!</p>
              <p className="text-sm text-slate-400 mt-2">Your plan has been upgraded to {selectedPlan && PLANS[selectedPlan as keyof typeof PLANS]?.name}</p>
              <Button className="mt-4" onClick={() => { setPricingOpen(false); resetPaymentDialog(); }}>Continue</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
