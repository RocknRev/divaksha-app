import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert as BootstrapAlert } from 'react-bootstrap';
import { productService } from '../../api/productService';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import Loader from '../../components/Loader/Loader';
import Alert from '../../components/Alert/Alert';
import './ProductDetails.css';

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    if (productId) {
      loadProduct();
    } else {
      setError('Product ID is required');
      setLoading(false);
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const productData = await productService.getProductById(parseInt(productId, 10));
      setProduct(productData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      navigate(`/orders/${product.productId}`);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) {
    return (
      <Container className="product-details-container py-5">
        <Loader />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="product-details-container py-5">
        <Alert
          variant="danger"
          message={error || 'Product not found'}
          onClose={() => navigate('/products')}
        />
        <div className="text-center mt-4">
          <Button variant="primary" onClick={() => navigate('/products')}>
            ← Back to Products
          </Button>
        </div>
      </Container>
    );
  }

  // Dummy content for health supplement powder
  const productFeatures = [
    '100% Natural Ingredients',
    'Rich in Essential Vitamins & Minerals',
    'Supports Overall Health & Wellness',
    'Easy to Mix & Consume',
    'GMP Certified Manufacturing',
    'No Artificial Preservatives',
  ];

  const productBenefits = [
    {
      icon: '💪',
      title: 'Boosts Energy',
      description: 'Natural ingredients that help increase daily energy levels',
    },
    {
      icon: '🛡️',
      title: 'Immune Support',
      description: 'Strengthens your immune system with essential nutrients',
    },
    {
      icon: '🧠',
      title: 'Mental Clarity',
      description: 'Supports cognitive function and mental alertness',
    },
    {
      icon: '❤️',
      title: 'Heart Health',
      description: 'Promotes cardiovascular wellness',
    },
  ];

  return (
    <Container className="product-details-container py-5">
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="product-image-card shadow-lg border-0">
            <div className="product-image-wrapper-large">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop'}
                alt={product.name}
                className="product-detail-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop';
                }}
              />
            </div>
          </Card>
        </Col>

        <Col lg={6}>
          <div className="product-info-section">
            <div className="mb-3">
              <Badge bg="success" className="mb-2">
                In Stock
              </Badge>
            </div>
            <h1 className="product-title mb-3">{product.name}</h1>
            <div className="product-price-section mb-4">
              <span className="product-price-large">₹{product.price.toFixed(2)}</span>
              <span className="text-muted ms-2">per unit</span>
            </div>

            {product.description && (
              <div className="product-description mb-4">
                <p className="lead">{product.description}</p>
              </div>
            )}

            {/* Extended Description */}
            <div className="product-extended-description mb-4">
              <h5 className="fw-bold mb-3">About This Product</h5>
              <p className="text-muted">
                Our premium health supplement powder is carefully formulated with a blend of natural ingredients
                designed to support your overall wellness journey. This comprehensive nutritional supplement provides
                essential vitamins, minerals, and antioxidants that your body needs to function at its best.
              </p>
              <p className="text-muted">
                Whether you're looking to boost your energy levels, support your immune system, or maintain optimal
                health, this supplement powder is an excellent addition to your daily routine. Simply mix with water,
                juice, or your favorite smoothie for a convenient and delicious way to nourish your body.
              </p>
            </div>

            {/* Key Features */}
            <div className="product-features mb-4">
              <h5 className="fw-bold mb-3">Key Features</h5>
              <ul className="feature-list">
                {productFeatures.map((feature, index) => (
                  <li key={index} className="mb-2">
                    <span className="text-success me-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector */}
            <div className="product-quantity mb-4">
              <label className="fw-semibold mb-2 d-block">Quantity</label>
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="outline-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </Button>
                <span className="quantity-display fw-bold fs-5">{quantity}</span>
                <Button variant="outline-secondary" onClick={() => setQuantity(quantity + 1)}>
                  +
                </Button>
                <span className="ms-auto text-muted">
                  Subtotal: <strong className="text-primary">₹{(product.price * quantity).toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Buy Now and Add to Cart Buttons */}
            <div className="product-actions">
              <div className="d-grid gap-2 mb-3">
                <Button
                  variant="outline-primary"
                  size="lg"
                  className="fw-bold py-3"
                  onClick={handleAddToCart}
                >
                  ➕ Add to Cart
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="fw-bold py-3"
                  onClick={handleBuyNow}
                >
                  🛒 Buy Now - ₹{(product.price * quantity).toFixed(2)}
                </Button>
              </div>
              <Button
                variant="outline-secondary"
                size="lg"
                className="w-100"
                onClick={() => navigate('/products')}
              >
                ← Back to Products
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Benefits Section */}
      <Row className="mt-5">
        <Col>
          <h3 className="text-center fw-bold mb-4">Health Benefits</h3>
          <Row>
            {productBenefits.map((benefit, index) => (
              <Col key={index} md={6} lg={3} className="mb-4">
                <Card className="h-100 benefit-card border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="benefit-icon mb-3">{benefit.icon}</div>
                    <h6 className="fw-bold">{benefit.title}</h6>
                    <p className="text-muted small mb-0">{benefit.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Usage Instructions */}
      <Row className="mt-5">
        <Col lg={8} className="mx-auto">
          <Card className="usage-card border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">📋 How to Use</h5>
              <ol className="mb-0">
                <li className="mb-2">
                  Mix one scoop (approximately 10g) with 200ml of water, juice, or your favorite beverage
                </li>
                <li className="mb-2">Stir well until completely dissolved</li>
                <li className="mb-2">Consume once daily, preferably in the morning with breakfast</li>
                <li className="mb-2">For best results, maintain a balanced diet and regular exercise routine</li>
                <li>Store in a cool, dry place away from direct sunlight</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Safety Information */}
      {/* <Row className="mt-4">
        <Col lg={8} className="mx-auto">
          <BootstrapAlert variant="info" className="mb-0">
            <BootstrapAlert.Heading className="h6 fw-bold">
              ⚠️ Important Information
            </BootstrapAlert.Heading>
            <p className="mb-0 small">
              This product is a dietary supplement and should not be used as a substitute for a balanced diet. Consult
              with a healthcare professional before use if you are pregnant, nursing, or have any medical conditions.
              Keep out of reach of children.
            </p>
          </BootstrapAlert>
        </Col>
      </Row> */}
    </Container>
  );
};

export default ProductDetails;

