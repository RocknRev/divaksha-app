import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { affiliateService } from '../../api/affiliateService';
import { affiliateUtils } from '../../utils/affiliate';
import Loader from '../../components/Loader/Loader';
import './Affiliate.css';

const Affiliate: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAndStore = async () => {
      if (!code) {
        setError('Invalid affiliate code');
        setLoading(false);
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        setLoading(true);
        // Validate affiliate code with backend
        const affiliateInfo = await affiliateService.validateAffiliateCode(code);

        // Store affiliate info in cookie and localStorage
        affiliateUtils.setAffiliate(
          affiliateInfo.affiliateUserId,
          affiliateInfo.code
        );

        // Redirect to products page
        navigate('/products');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid affiliate code');
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    validateAndStore();
  }, [code, navigate]);

  if (loading) {
    return (
      <Container className="affiliate-container">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="sm" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Validating affiliate link...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="affiliate-container">
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

export default Affiliate;

