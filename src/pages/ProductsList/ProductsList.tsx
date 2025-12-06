import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../../api/productService';
import { Product } from '../../types';
import { authUtils } from '../../utils/auth';
import Loader from '../../components/Loader/Loader';
import Alert from '../../components/Alert/Alert';
import './ProductsList.css';

const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadProducts();
    // Store referral from URL if present
    const refParam = searchParams.get('ref');
    if (refParam) {
      const refId = parseInt(refParam, 10);
      if (!isNaN(refId)) {
        authUtils.setReferralId(refId);
      }
    }
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await productService.getAllProducts();
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (productId: number, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card click event
    navigate(`/orders/${productId}`);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <Container className="products-list-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Products</h2>
        <div className="search-container" style={{ maxWidth: '400px', width: '100%' }}>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <div className="products-skeleton">
          <Row>
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Card className="h-100 product-card">
                  <div className="skeleton-image"></div>
                  <Card.Body>
                    <div className="skeleton-text mb-2"></div>
                    <div className="skeleton-text short"></div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">📦</div>
              <h4 className="text-muted">No products found</h4>
              <p className="text-muted">
                {searchQuery ? 'Try adjusting your search query' : 'No products available at the moment.'}
              </p>
              {searchQuery && (
                <Button variant="outline-primary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <>
              {searchQuery && (
                <p className="text-muted mb-3">
                  Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              )}
              <Row>
                {filteredProducts.map((product) => (
                  <Col key={product.productId} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <Card
                      className="h-100 product-card shadow-sm border-0"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleProductClick(product.productId)}
                    >
                      <div className="product-image-wrapper">
                        <Card.Img
                          variant="top"
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop'}
                          alt={product.name}
                          className="product-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop';
                          }}
                        />
                        <div className="product-overlay">
                          <Button
                            variant="light"
                            className="overlay-button"
                            onClick={(e) => handleProductClick(product.productId)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="fw-bold mb-2">{product.name}</Card.Title>
                        {product.description && (
                          <Card.Text className="flex-grow-1 text-muted small mb-3">
                            {product.description.length > 80
                              ? `${product.description.substring(0, 80)}...`
                              : product.description}
                          </Card.Text>
                        )}
                        <div className="mt-auto pt-2">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <Card.Text className="product-price fs-4 fw-bold text-primary mb-0">
                              ₹{product.price.toFixed(2)}
                            </Card.Text>
                          </div>
                          <Button
                            variant="primary"
                            className="w-100 fw-semibold"
                            size="lg"
                            onClick={(e) => handleBuyNow(product.productId, e)}
                          >
                            🛒 Buy Now
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductsList;
