import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Modal, Row, Col, InputGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { authService } from '../../api/authService';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { authUtils } from '../../utils/auth';
import Alert from '../../components/Alert/Alert';
import './RegisterUser.css';
import { affiliateUtils } from '../../utils/affiliate';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const referralCode = searchParams.get('ref');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    } as RegisterFormData,
  });

  const password = watch('password');

  // Affiliate code is read from localStorage in onSubmit

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for affiliate link - if user came via affiliate and registers, 
      // the affiliate owner becomes their parent
      const affiliateInfo = affiliateUtils.getAffiliate();
      let finalReferralCode = referralCode;
      
      // If no referral code in URL but affiliate cookie exists, use affiliate code
      if (!finalReferralCode && affiliateInfo) {
        finalReferralCode = affiliateInfo.affiliateCode;
      }
      
      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        referralCode: finalReferralCode || '',
        affiliateCode: affiliateInfo?.affiliateCode || '',
      });
      
      // Clear affiliate after registration (user is now registered)
      if (affiliateInfo) {
        affiliateUtils.clearAffiliate();
      }

      // Store token
      authUtils.setToken(response.token);

      // Update user with referral info
      const userWithReferral: User = {
        ...response.user,
        referralCode: response.referralCode,
        affiliateCode: response.affiliateCode,
      };

      // Save user and login
      authUtils.setCurrentUser(userWithReferral);
      login(userWithReferral);

      setCreatedUser(userWithReferral);
      setShowSuccessModal(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = () => {
    if (createdUser?.affiliateCode) {
      navigator.clipboard.writeText(`${window.location.origin}/aff/${createdUser.affiliateCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Container className="register-user-container">
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
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Username <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    size="lg"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' },
                    })}
                    placeholder="Choose a username"
                    isInvalid={!!errors.username}
                    className="form-control-lg"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Email Address <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    size="lg"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    placeholder="your.email@example.com"
                    isInvalid={!!errors.email}
                    className="form-control-lg"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Password <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      size="lg"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      placeholder="Enter your password"
                      isInvalid={!!errors.password}
                      className="form-control-lg"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Password must be at least 6 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Confirm Password <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      size="lg"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value:any) =>
                          value === password || 'Passwords do not match',
                      })}
                      placeholder="Confirm your password"
                      isInvalid={!!errors.confirmPassword}
                      className="form-control-lg"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      type="button"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" size="lg" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating Account...
                      </>
                    ) : (
                      '✨ Create Account'
                    )}
                  </Button>
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none fw-semibold">
                        Login here
                      </Link>
                    </small>
                  </div>
                  <Button variant="outline-secondary" onClick={() => navigate('/')}>
                    ← Back to Home
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>🎉 Registration Successful!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {createdUser && (
            <div>
              <div className="text-center mb-4">
                <div className="display-6 mb-2">✅</div>
                <h4>Welcome, {createdUser.username}!</h4>
                <p className="text-muted">Your account has been created successfully.</p>
              </div>

              <Card className="mb-3 border-success">
                <Card.Body>
                  <div className="mb-3">
                    <strong>User ID:</strong> {createdUser.id}
                  </div>
                  {createdUser.affiliateCode && (
                    <div className="mb-3">
                      <strong>Your Affiliate Link:</strong>
                      <div className="input-group mt-2">
                        <Form.Control type="text" value={`${window.location.origin}/aff/${createdUser.affiliateCode}`} readOnly />
                        <Button
                          variant={copied ? 'success' : 'outline-primary'}
                          onClick={copyAffiliateLink}
                        >
                          {copied ? '✓ Copied!' : '📋 Copy'}
                        </Button>
                      </div>
                      <small className="text-muted d-block mt-2">
                        Share this link to earn commissions when people register and purchase!
                      </small>
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong>{' '}
                    {createdUser.isActive ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-secondary">Inactive</span>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
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
