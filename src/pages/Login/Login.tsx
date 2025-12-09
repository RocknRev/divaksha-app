import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../api/authService';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { authUtils } from '../../utils/auth';
import Alert from '../../components/Alert/Alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/UI/card';
import { Input } from '../../components/UI/input';
import { Button } from '../../components/UI/button';
import { Label } from '../../components/UI/label';
import { toast } from 'sonner';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormData,
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (response.verifyStatus === "INVALID") {
        setError("Invalid email id or password.");
        return;
      }
      // Store token
      authUtils.setToken(response.token);

      // Update user with referral info if available
      const userWithReferral: User = {
        ...response.user,
        referralCode: response.referralCode,
        affiliateCode: response.affiliateCode,
      };

      // Save user and login
      authUtils.setCurrentUser(userWithReferral);
      login(userWithReferral);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <div className="text-center mb-6 space-y-2">
          <h2 className="text-3xl font-bold text-text-primary">Welcome Back</h2>
          <p className="text-text-secondary text-sm">Sign in to your Divaksha account</p>
        </div>

        {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Use your email and password to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label>
                  Email Address <span className="text-danger">*</span>
                </Label>
                <Input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="your.email@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  Password <span className="text-danger">*</span>
                </Label>
                <Input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                />
                {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? 'Signing in...' : '🔐 Sign In'}
              </Button>
            </form>

            <div className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary hover:text-primary-hover font-semibold">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-text-secondary hover:text-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

