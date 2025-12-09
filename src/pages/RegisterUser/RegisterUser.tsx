import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, InputGroup, Modal, Badge } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { authService } from '../../api/authService';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { authUtils } from '../../utils/auth';
import Alert from '../../components/Alert/Alert';
import { affiliateUtils } from '../../utils/affiliate';
import './RegisterUser.css';
import { OtpInput } from '../../components/UI/otpInput';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const OTP_VALIDITY_SECONDS = 3 * 60; // 3 minutes in seconds

const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // OTP State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // in seconds
  const [canResend, setCanResend] = useState(false);

  const methods = useForm({
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' } as RegisterFormData,
  });

  const { register: formRegister, handleSubmit, formState, watch, reset, getValues } = methods;
  const { errors } = formState;
  const password = watch('password');
  const email = watch('email');

  // OTP Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (otpTimer > 0 && showOtpInput && !emailVerified) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            setOtpError('OTP expired. Please resend.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (otpTimer === 0 && showOtpInput && !emailVerified) {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer, showOtpInput, emailVerified]);

  // Reset email verification when email changes
  useEffect(() => {
    if (email && emailVerified) {
      setEmailVerified(false);
      setShowOtpInput(false);
      setOtpValue('');
      setOtpTimer(0);
      setCanResend(false);
      setOtpError(null);
    }
  }, [email]);

  // Format timer display
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP Handler
  const sendOtp = async () => {
    const emailVal = getValues().email;
    
    if (!emailVal) {
      setError('Please enter your email address first.');
      return;
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(emailVal)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setOtpError(null);
    setOtpSending(true);
    setCanResend(false);

    try {
      const result = await authService.sendOtp(emailVal);
      if (result === "SUCCESS") {
        setShowOtpInput(true);
        setOtpTimer(OTP_VALIDITY_SECONDS);
        setOtpValue('');
      }else {
        setError(result);
      }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to send OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setOtpSending(false);
    }
  };

  // Resend OTP Handler
  const resendOtp = async () => {
    setOtpValue('');
    setOtpError(null);
    await sendOtp();
  };

  // Verify OTP Handler
  const verifyOtp = async () => {
    const emailVal = getValues().email;
    
    if (!emailVal) {
      setOtpError('Email is missing. Please re-enter your email.');
      return;
    }

    if (!otpValue || otpValue.trim().length === 0) {
      setOtpError('Please enter the OTP.');
      return;
    }

    if (otpTimer === 0) {
      setOtpError('OTP has expired. Please resend.');
      return;
    }

    setOtpVerifying(true);
    setOtpError(null);

    try {
      const otpStatus = await authService.verifyOtp(emailVal, otpValue.trim());
      if (otpStatus === "SUCCESS") {
        setEmailVerified(true);
        setOtpError(null);
        setEmailVerified(true);
        setShowOtpInput(false);
        setOtpValue('');
        setOtpTimer(0);
        setCanResend(false);
        setOtpError(null);
      }else if (otpStatus === "INVALID") {
        setOtpError("Invalid OTP. Please try again.");
      }else if (otpStatus === "EXPIRED") {
        setOtpError("OTP expired. Please request a new one.");
      }
    } catch (e: any) {
      setOtpError("Unexpected error. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  // Form Submit Handler
  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    if (!emailVerified) {
      setError('Please verify your email address using OTP before submitting.');
      return;
    }

    try {
      setLoading(true);

      const affiliateInfo = affiliateUtils.getAffiliate();
      const finalReferralCode = referralCode || affiliateInfo?.affiliateCode || '';

      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        referralCode: finalReferralCode || undefined,
        affiliateCode: affiliateInfo?.affiliateCode || undefined,
      });

      if (affiliateInfo) {
        affiliateUtils.clearAffiliate();
      }

      authUtils.setToken(response.token);
      const userWithReferral: User = {
        ...response.user,
        referralCode: response.referralCode,
        affiliateCode: response.affiliateCode,
        referralLink: response.referralLink,
      };
      authUtils.setCurrentUser(userWithReferral);
      login(userWithReferral);

      setCreatedUser(userWithReferral);
      setShowSuccess(true);
      reset();
      setEmailVerified(false);
      setShowOtpInput(false);
      setOtpValue('');
      setOtpTimer(0);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to register user. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Copy Affiliate Link
  const copyAffiliateLink = () => {
    if (createdUser?.affiliateCode) {
      const affiliateLink = `${window.location.origin}/aff/${createdUser.affiliateCode}`;
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Container className="register-user-container py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="register-header text-center mb-4">
            <h2 className="display-5 fw-bold">Join Divaksha</h2>
            <p className="text-muted">
              {referralCode
                ? `You've been referred! Register to start earning commissions.`
                : 'Create your account and start earning through referrals'}
            </p>
          </div>

          {referralCode && (
            <Alert
              variant="info"
              message={`Referral code detected: ${referralCode}. You'll be registered under this referrer.`}
              onClose={() => {}}
            />
          )}

          {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit(onSubmit)}>
                {/* Username */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Username <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="lg"
                    {...formRegister('username', {
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores',
                      },
                    })}
                    placeholder="Choose a username"
                    isInvalid={!!errors.username}
                  />
                  <Form.Control.Feedback type="invalid">{errors.username?.message}</Form.Control.Feedback>
                </Form.Group>

                {/* Email with Inline OTP */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Email Address <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="email"
                      size="lg"
                      {...formRegister('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      placeholder="your.email@example.com"
                      isInvalid={!!errors.email}
                      disabled={emailVerified}
                    />
                    <Button
                      variant={emailVerified ? 'success' : 'outline-primary'}
                      onClick={sendOtp}
                      disabled={otpSending || emailVerified || !email}
                      size="lg"
                    >
                      {otpSending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Sending...
                        </>
                      ) : emailVerified ? (
                        '✓ Verified'
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>

                  {/* Email Verification Status */}
                  {emailVerified && (
                    <div className="mt-2">
                      <Badge bg="success" className="p-2">
                        ✓ Email verified successfully
                      </Badge>
                    </div>
                  )}

                  {/* Inline OTP Input Section */}
                  {showOtpInput && !emailVerified && (
                    <div className="mt-3 p-3 bg-light rounded border">
                      <div className="mb-2">
                        <Form.Label className="fw-semibold small">
                          Enter OTP sent to <strong>{email}</strong>
                        </Form.Label>
                      </div>
                      <InputGroup>
                        <OtpInput
                          value={otpValue}
                          onChange={(val) => {
                            setOtpValue(val);
                            setOtpError(null);
                          }}
                        />
                        <Button
                          variant="primary"
                          onClick={verifyOtp}
                          disabled={otpVerifying || !otpValue || otpValue.length !== 6 || otpTimer === 0}
                        >
                          {otpVerifying ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" />
                              Verifying...
                            </>
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      </InputGroup>

                      {/* Timer and Resend */}
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="small">
                          {otpTimer > 0 ? (
                            <span className="text-muted">
                              OTP expires in: <strong className="text-warning">{formatTimer(otpTimer)}</strong>
                            </span>
                          ) : (
                            <span className="text-danger">OTP expired</span>
                          )}
                        </div>
                        {canResend && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={resendOtp}
                            disabled={otpSending}
                            className="p-0 text-decoration-none"
                          >
                            {otpSending ? 'Sending...' : 'Resend OTP'}
                          </Button>
                        )}
                      </div>

                      {/* OTP Error Message */}
                      {otpError && (
                        <div className="mt-2">
                          <small className="text-danger">{otpError}</small>
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Password <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      size="lg"
                      {...formRegister('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      placeholder="Enter your password"
                      isInvalid={!!errors.password}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      size="lg"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
                  <Form.Text className="text-muted">Password must be at least 6 characters long</Form.Text>
                </Form.Group>

                {/* Confirm Password */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Confirm Password <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      size="lg"
                      {...formRegister('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value: string) => value === password || 'Passwords do not match',
                      })}
                      placeholder="Confirm your password"
                      isInvalid={!!errors.confirmPassword}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      type="button"
                      size="lg"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.confirmPassword?.message}</Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={loading || !emailVerified}
                    className="fw-semibold py-3"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating Account...
                      </>
                    ) : (
                      '✨ Create Account'
                    )}
                  </Button>
                  {!emailVerified && (
                    <small className="text-warning text-center">
                      ⚠️ Please verify your email address before submitting
                    </small>
                  )}
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none fw-semibold">
                        Login here
                      </Link>
                    </small>
                  </div>
                  <Button variant="outline-secondary" onClick={() => navigate('/')} size="lg">
                    ← Back to Home
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success Modal */}
      <Modal show={showSuccess} onHide={() => setShowSuccess(false)} centered size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="fw-bold">🎉 Registration Successful!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {createdUser && (
            <div>
              <div className="text-center mb-4">
                <div className="display-6 mb-2">✅</div>
                <h4 className="fw-bold">Welcome, {createdUser.username}!</h4>
                <p className="text-muted">Your account has been created successfully.</p>
              </div>

              <Card className="mb-3 border-success">
                <Card.Body>
                  <div className="mb-3">
                    <strong>User ID:</strong> <code>{createdUser.id}</code>
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong> {createdUser.email || 'N/A'}
                  </div>
                  {createdUser.affiliateCode && (
                    <div className="mb-3">
                      <strong>Your Affiliate Link:</strong>
                      <div className="input-group mt-2">
                        <Form.Control
                          type="text"
                          value={`${window.location.origin}/aff/${createdUser.affiliateCode}`}
                          readOnly
                        />
                        <Button variant={copied ? 'success' : 'outline-primary'} onClick={copyAffiliateLink}>
                          {copied ? '✓ Copied!' : '📋 Copy'}
                        </Button>
                      </div>
                      <small className="text-muted d-block mt-2">
                        Share this link to earn commissions when people register and purchase!
                      </small>
                    </div>
                  )}
                  {createdUser.referralLink && (
                    <div className="mb-3">
                      <strong>Your Referral Link:</strong>
                      <div className="input-group mt-2">
                        <Form.Control type="text" value={createdUser.referralLink} readOnly />
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            navigator.clipboard.writeText(createdUser.referralLink!);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? '✓ Copied!' : '📋 Copy'}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong>{' '}
                    {createdUser.isActive ? (
                      <Badge bg="success">Active</Badge>
                    ) : (
                      <Badge bg="secondary">Inactive</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuccess(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccess(false);
              navigate('/dashboard');
            }}
          >
            Go to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RegisterUser;
