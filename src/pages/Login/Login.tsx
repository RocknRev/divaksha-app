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
import './Login.css';
import { Modal } from 'react-bootstrap';
import { OtpInput } from '../../components/UI/otpInput';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpOtpSent, setFpOtpSent] = useState(false);
  const [fpOtpVerified, setFpOtpVerified] = useState(false);
  const [fpTimer, setFpTimer] = useState(0);
  const [fpError, setFpError] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpVerifyLoading, setFpVerifyLoading] = useState(false);
  const [fpSuccess, setFpSuccess] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const OTP_VALIDITY_SECONDS = 3 * 60; // 3 minutes in seconds

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
  
    if (fpTimer > 0 && fpOtpSent && !fpOtpVerified) {
      interval = setInterval(() => {
        setFpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fpTimer, fpOtpSent, fpOtpVerified]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
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

  const sendForgotOtp = async () => {
    if (!fpEmail) {
      setFpError('Please enter your email.');
      return;
    }
    
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(fpEmail)) {
      setFpError('Please enter a valid email address.');
      return;
    }
  
    try {
      setCanSend(false);
      setFpLoading(true);
      setFpError(null);
      setFpSuccess(null);
  
      const result = await authService.sendOtpForPasswordReset(fpEmail);
      if (result === "SUCCESS") {
        setFpOtpSent(true);
        setFpTimer(OTP_VALIDITY_SECONDS);
        setCanResend(false);
        setFpOtp('');
      }else {
        setFpError(result);
        setCanSend(true);
      }
    } catch {
      setFpError('Failed to send OTP. Please try again.');
      setCanSend(true);
    } finally {
      setFpLoading(false);
    }
  };  

  const verifyForgotOtp = async () => {
    if (!fpOtp || fpOtp.length !== 6) {
      setFpError('Please enter a valid 6-digit OTP.');
      return;
    }
  
    try {
      setFpVerifyLoading(true);
      setFpError(null);
  
      const status = await authService.verifyOtp(fpEmail, fpOtp.trim());
  
      if (status === 'SUCCESS') {
        setFpOtpVerified(true);
        setFpSuccess('Email verified successfully.');
      } else {
        setFpError('Invalid or expired OTP.');
      }
    } catch {
      setFpError('OTP verification failed.');
    } finally {
      setFpVerifyLoading(false);
    }
  };
  
  const resetPassword = async () => {
    if (newPassword.length < 6) {
      setFpError('Password must be at least 6 characters.');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setFpError('Passwords do not match.');
      return;
    }
  
    try {
      setFpLoading(true);
      setFpError(null);
  
      const resetStatus = await authService.resetPassword(fpEmail, newPassword);
  
      if(resetStatus === "SUCCESS"){
        setFpSuccess('Password reset successful. Please login.');
        setTimeout(() => {
          closeForgotModal();
        }, 1500);
      }else if(resetStatus === "SAME_PASSWORD"){
        setFpError('Old password and new password cannot be the same.');
      }else{
        setFpError('Failed to reset password.');
      }
    } catch {
      setFpError('Failed to reset password.');
    } finally {
      setFpLoading(false);
    }
  };  
  
  const closeForgotModal = () => {
    setShowForgot(false);
    setFpEmail('');
    setFpOtp('');
    setFpOtpSent(false);
    setFpOtpVerified(false);
    setFpTimer(0);
    setCanResend(false);
    setCanSend(true);
    setFpError(null);
    setFpSuccess(null);
    setNewPassword('');
    setConfirmPassword('');
  };
  
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
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to Divaksha
          </p>
        </div>
  
        {error && (
          <Alert
            variant="danger"
            message={error}
            onClose={() => setError(null)}
          />
        )}
  
        <Card className="border border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
  
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value:
                        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
  
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message:
                        'Password must be at least 6 characters',
                    },
                  })}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>
  
              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
  
            <Modal show={showForgot} onHide={closeForgotModal} centered dialogClassName="forgot-password-modal">
              <Modal.Body className="p-4">

                {/* Header */}
                <div className="mb-4 text-center">
                  <h4 className="fw-semibold text-dark">Reset your password</h4>
                  <p className="text-muted small mb-0">
                    We’ll send a one-time password to your email
                  </p>
                </div>

                {fpError && (
                  <Alert
                    variant="danger"
                    message={fpError}
                    onClose={() => setFpError(null)}
                  />
                )}

                {fpSuccess && (
                  <Alert
                    variant="success"
                    message={fpSuccess}
                    onClose={() => setFpSuccess(null)}
                  />
                )}

                {/* EMAIL + SEND OTP */}
                <div className="space-y-2">
                  <Label>Email address</Label>

                  <div className="d-flex gap-2 align-items-center flex-nowrap">
                    <Input className="flex-grow-1 w-auto"
                      type="email"
                      value={fpEmail}
                      onChange={(e) => {
                        setFpEmail(e.target.value);
                        setFpError(null);
                      }}
                      placeholder="you@example.com"
                      disabled={fpOtpVerified}
                    />

                    <Button
                      variant={fpOtpVerified ? 'success' : 'outline'}
                      onClick={sendForgotOtp} 
                      disabled={fpLoading || fpOtpVerified || !fpEmail || !canSend}
                    >
                      {fpLoading ? 'Sending…' : fpOtpVerified ? '✓ Verified' : 'Send OTP'}
                    </Button>
                  </div>
                </div>

                {/* OTP INPUT */}
                {fpOtpSent && !fpOtpVerified && (
                  <div className="mt-3 p-3 rounded border bg-light">
                    <Label className="small fw-semibold">
                      Enter OTP sent to <strong>{fpEmail}</strong>
                    </Label>

                    <div className="d-flex gap-2 mt-2">
                      <OtpInput
                        value={fpOtp}
                        onChange={(val) => {
                          setFpOtp(val);
                          setFpError(null);
                        }}
                      />

                      <Button
                        onClick={verifyForgotOtp}
                        disabled={fpVerifyLoading || fpOtp.length !== 6 || fpTimer === 0}
                      >
                        {fpVerifyLoading ? 'Verifying…' : 'Verify'}
                      </Button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-muted">
                        {fpTimer > 0
                          ? `OTP expires in ${formatTimer(fpTimer)}`
                          : 'OTP expired'}
                      </small>

                      {canResend && (
                        <button
                          type="button"
                          className="text-sm text-primary underline"
                          onClick={sendForgotOtp}
                          disabled={fpLoading}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RESET PASSWORD */}
                {fpOtpVerified && (
                  <div className="mt-3 space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <Label className="mt-2">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <Button className="w-100 mt-3" onClick={resetPassword}>
                      Reset Password
                    </Button>
                  </div>
                )}

              </Modal.Body>
            </Modal>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don’t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
  
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

