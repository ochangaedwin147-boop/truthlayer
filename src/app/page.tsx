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
  Copy, RefreshCw, ChevronRight, Clock, AlertCircle
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

// Plans configuration
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 verifications per day', 'Basic AI analysis', 'Chrome extension access', 'Community support'],
    color: 'gray'
  },
  starter: {
    name: 'Starter',
    price: 9,
    features: ['50 verifications per day', 'Detailed AI analysis', 'API access (1,000 calls/month)', 'Priority support', 'Verification history'],
    color: 'blue'
  },
  pro: {
    name: 'Pro',
    price: 29,
    features: ['Unlimited verifications', 'Advanced AI analysis', 'API access (10,000 calls/month)', 'Priority support', 'Full verification history', 'Bulk analysis', 'Custom flags'],
    color: 'purple'
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
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

  const getTrustIcon = (score: number) => {
    if (score >= 60) return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (score >= 40) return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-lime-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
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
        {/* Header */}
        <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-500" />
              <span className="text-xl font-bold">TruthLayer</span>
            </div>
            
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost">Login</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Login to TruthLayer</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Enter your credentials to access your account
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                      {authLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create your account</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Start detecting misinformation today
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-name">Name (optional)</Label>
                      <Input
                        id="signup-name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password (min 6 characters)</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                      {authLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700/50 p-4 flex flex-col gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">Login</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Login to TruthLayer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                      {authLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create your account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label>Name (optional)</Label>
                      <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="bg-slate-700 border-slate-600" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <div>
                      <Label>Password (min 6 characters)</Label>
                      <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                      {authLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Misinformation Detection
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
              Detect Fake Content Instantly
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              TruthLayer uses advanced AI to verify any content in seconds. Get trust scores, detailed analysis, and warning flags to protect yourself from misinformation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                    Start Free Trial <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create your account</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Start detecting misinformation today
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label>Name (optional)</Label>
                      <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="bg-slate-700 border-slate-600" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <div>
                      <Label>Password (min 6 characters)</Label>
                      <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                      {authLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" className="border-slate-600 hover:bg-slate-800 text-lg px-8" onClick={() => setPricingOpen(true)}>
                View Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="w-8 h-8" />, title: 'AI-Powered Analysis', desc: 'Our advanced AI detects misinformation patterns, bias, and unreliable claims with high accuracy.' },
              { icon: <Zap className="w-8 h-8" />, title: 'Instant Results', desc: 'Get trust scores and detailed analysis in seconds. No waiting, no complicated setup required.' },
              { icon: <Globe className="w-8 h-8" />, title: 'Works Everywhere', desc: 'Use our Chrome extension, web app, or API to verify content from any source.' },
              { icon: <Lock className="w-8 h-8" />, title: 'Privacy First', desc: 'Your content is analyzed securely. We don\'t store sensitive data beyond what\'s needed.' },
              { icon: <TrendingUp className="w-8 h-8" />, title: 'Trust Scores', desc: 'Get a clear 0-100 trust score with detailed breakdown of why content received its rating.' },
              { icon: <Users className="w-8 h-8" />, title: 'Team Plans', desc: 'Enterprise features for teams including API access, bulk analysis, and dedicated support.' },
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors">
                <CardHeader>
                  <div className="text-emerald-500 mb-2">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Paste Content', desc: 'Copy any text you want to verify - articles, social media posts, emails, or messages.' },
              { step: '2', title: 'AI Analysis', desc: 'Our AI analyzes the content for misinformation patterns, bias, and reliability indicators.' },
              { step: '3', title: 'Get Results', desc: 'Receive a trust score, detailed analysis, and warning flags to make informed decisions.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
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
                {key === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}<span className="text-lg text-slate-400">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className={`w-full ${key === 'pro' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                        onClick={() => {
                          setSignupEmail('');
                          setSignupPassword('');
                        }}
                      >
                        Get Started
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Create your account</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <Label>Name (optional)</Label>
                          <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="bg-slate-700 border-slate-600" />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required />
                        </div>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                          {authLoading ? 'Creating...' : 'Create Account'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to detect misinformation?</h2>
              <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
                Join thousands of users who trust TruthLayer to verify content and protect themselves from fake news.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white text-emerald-600 hover:bg-slate-100">
                    Start Free Today
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create your account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label>Name (optional)</Label>
                      <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} className="bg-slate-700 border-slate-600" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authLoading}>
                      {authLoading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 py-8">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-white">TruthLayer</span>
            </div>
            <p className="text-sm">AI-powered misinformation detection. Created by Edwin McCain.</p>
            <p className="text-sm mt-2">&copy; {new Date().getFullYear()} TruthLayer. All rights reserved.</p>
          </div>
        </footer>

        {/* Pricing Dialog */}
        <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose Your Plan</DialogTitle>
              <DialogDescription className="text-slate-400">
                Start free, upgrade when you need more
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(PLANS).map(([key, plan]) => (
                <Card key={key} className={`bg-slate-700/50 border-slate-600 ${key === 'pro' ? 'border-emerald-500' : ''}`}>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold">${plan.price}/mo</div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
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
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-500" />
            <span className="text-xl font-bold">TruthLayer</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              {auth.subscription?.plan?.toUpperCase() || 'FREE'}
            </Badge>
            <div className="hidden sm:block text-sm text-slate-400">
              {auth.user?.email}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="verify" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="verify" className="data-[state=active]:bg-emerald-600">
              <Eye className="w-4 h-4 mr-2" /> Verify
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600" onClick={loadHistory}>
              <History className="w-4 h-4 mr-2" /> History
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-emerald-600">
              <Key className="w-4 h-4 mr-2" /> API
            </TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:bg-emerald-600">
              <CreditCard className="w-4 h-4 mr-2" /> Plan
            </TabsTrigger>
          </TabsList>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6">
            {/* Usage Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Today's Verifications</p>
                    <p className="text-2xl font-bold">
                      {auth.todayVerifications}
                      {getDailyLimit() > 0 && <span className="text-slate-400 text-lg"> / {getDailyLimit()}</span>}
                      {getDailyLimit() === -1 && <span className="text-emerald-400 text-sm ml-2">(Unlimited)</span>}
                    </p>
                  </div>
                  {getDailyLimit() > 0 && (
                    <div className="flex-1 max-w-xs">
                      <Progress value={(auth.todayVerifications / getDailyLimit()) * 100} className="h-2" />
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setPricingOpen(true)}>
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-500" />
                    Content to Verify
                  </CardTitle>
                  <CardDescription>
                    Paste any text content to analyze for misinformation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your content here... (articles, social media posts, emails, messages, etc.)"
                    className="min-h-[300px] bg-slate-700 border-slate-600 resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    onClick={handleVerify}
                    disabled={verifying || !content.trim()}
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Content
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Results */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    Verification Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-6">
                      {/* Trust Score */}
                      <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="64" cy="64" r="56"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="12"
                              className="text-slate-700"
                            />
                            <circle
                              cx="64" cy="64" r="56"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="12"
                              strokeDasharray={`${(result.trustScore / 100) * 352} 352`}
                              className={result.trustColor === 'green' ? 'text-green-500' : 
                                        result.trustColor === 'lime' ? 'text-lime-500' :
                                        result.trustColor === 'yellow' ? 'text-yellow-500' :
                                        result.trustColor === 'orange' ? 'text-orange-500' : 'text-red-500'}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div>
                              <div className="text-3xl font-bold">{result.trustScore}</div>
                              <div className="text-xs text-slate-400">/ 100</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge className={`${
                            result.trustColor === 'green' ? 'bg-green-500' : 
                            result.trustColor === 'lime' ? 'bg-lime-500' :
                            result.trustColor === 'yellow' ? 'bg-yellow-500' :
                            result.trustColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                          } text-white`}>
                            {result.trustLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">{result.trustDescription}</p>
                      </div>

                      {/* Flags */}
                      {result.flags.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Warning Flags:</p>
                          <div className="flex flex-wrap gap-2">
                            {result.flags.map((flag, i) => (
                              <Badge key={i} variant="outline" className="border-yellow-500/50 text-yellow-400">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {flag.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator className="bg-slate-700" />

                      {/* Analysis */}
                      <div>
                        <p className="text-sm font-medium mb-2">Detailed Analysis:</p>
                        <ScrollArea className="h-[200px] rounded-md bg-slate-700/50 p-4">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{result.analysis}</p>
                        </ScrollArea>
                      </div>

                      {/* Hash */}
                      <p className="text-xs text-slate-500 font-mono break-all">
                        Hash: {result.contentHash}
                      </p>
                    </div>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Results will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500" />
                  Verification History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-slate-500" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No verification history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <Card key={item.id} className="bg-slate-700/50 border-slate-600">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm text-slate-300 line-clamp-2">{item.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500">
                                  {new Date(item.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-center shrink-0">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                item.trustScore >= 60 ? 'bg-green-500/20 text-green-400' :
                                item.trustScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {item.trustScore}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-500" />
                  API Access
                </CardTitle>
                <CardDescription>
                  Use your API key to integrate TruthLayer into your applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {auth.subscription?.plan === 'free' ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400">
                      Upgrade to a paid plan to get full API access and the ability to regenerate your API key.
                    </p>
                    <Button className="mt-4" onClick={() => setPricingOpen(true)}>
                      Upgrade Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Your API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={auth.apiKey || ''}
                          readOnly
                          className="bg-slate-700 border-slate-600 font-mono"
                        />
                        <Button variant="outline" onClick={copyApiKey}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={regenerateApiKey}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div>
                      <Label>API Endpoint</Label>
                      <code className="block bg-slate-700 p-2 rounded mt-1 text-sm">
                        POST /api/verify
                      </code>
                    </div>

                    <div>
                      <Label>Example Request</Label>
                      <pre className="bg-slate-700 p-4 rounded mt-1 text-sm overflow-x-auto">
{`fetch('/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Your text to verify...'
  })
})`}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Your Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <Card 
                      key={key} 
                      className={`bg-slate-700/50 border-slate-600 ${
                        auth.subscription?.plan === key ? 'border-emerald-500 ring-1 ring-emerald-500' : ''
                      }`}
                    >
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="text-2xl font-bold">${plan.price}/mo</div>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <ul className="space-y-1 mb-4">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {auth.subscription?.plan === key ? (
                          <Button className="w-full" disabled>Current Plan</Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            variant={key === 'pro' ? 'default' : 'outline'}
                            onClick={() => setPricingOpen(true)}
                          >
                            {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Pricing Dialog */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose the plan that fits your needs
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(PLANS).slice(1).map(([key, plan]) => (
              <Card key={key} className="bg-slate-700/50 border-slate-600">
                <CardHeader className="text-center pb-2">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">${plan.price}/mo</div>
                </CardHeader>
                <CardContent className="text-sm">
                  <ul className="space-y-1 mb-4">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={auth.subscription?.plan === key}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ plan: key })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setAuth(prev => ({
                            ...prev,
                            subscription: { plan: data.subscription.plan, status: data.subscription.status }
                          }));
                          setPricingOpen(false);
                          toast({ title: 'Plan Updated!', description: `You are now on the ${plan.name} plan` });
                        }
                      } catch {
                        toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
                      }
                    }}
                  >
                    {auth.subscription?.plan === key ? 'Current Plan' : 'Select'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
