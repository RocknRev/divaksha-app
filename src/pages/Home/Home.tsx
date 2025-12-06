import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Container className="home-container">
      <div className="hero-section text-center py-5 mb-5">
        <h1 className="display-3 fw-bold mb-3">
          Welcome to <span className="gradient-text">Divaksha</span>
        </h1>
        <p className="lead mb-4">
          Your gateway to earning through referrals. Join thousands earning passive income!
        </p>
        {isAuthenticated ? (
          <div>
            <p className="mb-3">Welcome back, <strong>{currentUser?.username}</strong>!</p>
            <Button variant="primary" size="lg" className="me-2" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline-primary" size="lg" onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div>
            <Button variant="primary" size="lg" className="me-2" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="outline-primary" size="lg" className="me-2" onClick={() => navigate('/register')}>
              Register Now
            </Button>
            <Button variant="outline-light" size="lg" onClick={() => navigate('/products')}>
              View Products
            </Button>
          </div>
        )}
      </div>

      <Row className="mb-5">
        <Col md={4} className="mb-4">
          <Card className="feature-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="feature-icon mb-3">💰</div>
              <h4>Earn Commissions</h4>
              <p className="text-muted">
                Earn up to 10 levels deep. The more you refer, the more you earn!
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="feature-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="feature-icon mb-3">🔗</div>
              <h4>Unique Referral Links</h4>
              <p className="text-muted">
                Get your personalized referral link and share it with anyone, anywhere.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="feature-card h-100 border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div className="feature-icon mb-3">📊</div>
              <h4>Track Everything</h4>
              <p className="text-muted">
                Monitor your referrals, commissions, and earnings in real-time.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8} className="mx-auto">
          <Card className="info-card border-0 shadow">
            <Card.Body className="p-4">
              <h3 className="mb-3">How It Works</h3>
              <ol className="text-start">
                <li className="mb-2">
                  <strong>Register:</strong> Create your free account and get your unique referral link.
                </li>
                <li className="mb-2">
                  <strong>Share:</strong> Share your referral link with friends, family, or on social media.
                </li>
                <li className="mb-2">
                  <strong>Earn:</strong> When someone registers through your link and makes a purchase, you earn commissions!
                </li>
                <li>
                  <strong>Grow:</strong> Build your network and watch your earnings grow through multiple levels.
                </li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
