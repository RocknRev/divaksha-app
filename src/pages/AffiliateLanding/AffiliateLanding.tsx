import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import './AffiliateLanding.css';

const AFFILIATE_CODE_STORAGE_KEY = 'affiliateCode';

const AffiliateLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAffiliateCode = () => {
      if (!code) {
        setError('Invalid affiliate code');
        setLoading(false);
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        // Save affiliate code to localStorage
        localStorage.setItem(AFFILIATE_CODE_STORAGE_KEY, code);
        
        // Redirect to products page
        navigate('/products');
      } catch (err) {
        setError('Failed to process affiliate link');
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAffiliateCode();
  }, [code, navigate]);

  if (loading) {
    return (
      <Container className="affiliate-landing-container">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="sm" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Processing affiliate link...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="affiliate-landing-container">
        <Alert variant="danger" className="mt-5">
          <Alert.Heading>Invalid Affiliate Link</Alert.Heading>
          <p>{error}</p>
          <p className="mb-0">Redirecting to homepage...</p>
        </Alert>
      </Container>
    );
  }

  return null;
};

export default AffiliateLanding;

