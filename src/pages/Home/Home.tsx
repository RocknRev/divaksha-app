import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/UI/card';
import { Button } from '../../components/UI/button';
import { Badge } from '../../components/UI/badge';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  const actions = isAuthenticated ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button size="lg" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
      <Button variant="outline" size="lg" onClick={() => navigate('/products')}>
        Browse Products
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button size="lg" onClick={() => navigate('/login')}>
        Login
      </Button>
      <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
        Register Now
      </Button>
      <Button variant="ghost" size="lg" onClick={() => navigate('/products')}>
        View Products
      </Button>
    </div>
  );

  const features = [
    { icon: '💰', title: 'Earn Commissions', desc: 'Earn up to 10 levels deep. The more you refer, the more you earn!' },
    { icon: '🔗', title: 'Unique Referral Links', desc: 'Get your personalized referral link and share it with anyone, anywhere.' },
    { icon: '📊', title: 'Track Everything', desc: 'Monitor your referrals, commissions, and earnings in real-time.' },
  ];

  const steps = [
    { title: 'Register', desc: 'Create your free account and get your unique referral link.' },
    { title: 'Share', desc: 'Share your referral link with friends, family, or on social media.' },
    { title: 'Earn', desc: 'When someone registers and purchases, you earn commissions.' },
    { title: 'Grow', desc: 'Build your network and watch your earnings grow through multiple levels.' },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-white shadow-soft border-none">
          <CardContent className="py-12 text-center space-y-4">
            <Badge variant="outline" className="bg-white/15 text-white border-white/30 px-4 py-1">
              Premium Affiliate + Commerce
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome to Divaksha — Tycon’s G1 Prash
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
              Your gateway to premium wellness and referral earnings. Join thousands already earning passive income.
            </p>
            <div className="text-white/90">
              {isAuthenticated && <p className="mb-3 text-sm">Welcome back, <strong>{currentUser?.username}</strong>!</p>}
              {actions}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="shadow-soft">
              <CardContent className="p-5 text-center space-y-3">
                <div className="text-3xl">{f.icon}</div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
            <CardDescription>Simple steps to start earning with Divaksha.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-3">
              {steps.map((step, idx) => (
                <li key={step.title} className="flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-text-primary">{step.title}</p>
                    <p className="text-sm text-text-secondary">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
