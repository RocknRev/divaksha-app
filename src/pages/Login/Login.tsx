import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { authService } from '../../api/authService';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { authUtils } from '../../utils/auth';
import Alert from '../../components/Alert/Alert';
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
    <Container className="login-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={6} lg={5} xl={4}>
          <div className="login-header text-center mb-4">
            <h2 className="display-5 fw-bold">Welcome Back</h2>
            <p className="text-muted">Sign in to your Divaksha account</p>
          </div>

          {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit(onSubmit)}>
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

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Password <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
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
                  <Form.Control.Feedback type="invalid">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2 mb-3">
                  <Button variant="primary" size="lg" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Signing in...
                      </>
                    ) : (
                      '🔐 Sign In'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none fw-semibold">
                      Register here
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center mt-4">
            <Link to="/" className="text-decoration-none text-muted">
              ← Back to Home
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;

