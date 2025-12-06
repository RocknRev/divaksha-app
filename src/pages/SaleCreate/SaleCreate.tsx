import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Modal, Row, Col, Badge, Alert as BootstrapAlert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { saleService } from '../../api/saleService';
import { productService } from '../../api/productService';
import { CreateSaleRequest, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { affiliateUtils } from '../../utils/affiliate';
import Alert from '../../components/Alert/Alert';
import Loader from '../../components/Loader/Loader';
import './SaleCreate.css';

interface SaleFormData {
  buyerId: number;
  sellerId?: number;
  productId: number;
  quantity: number;
  paymentProofUrl: string;
}

const SaleCreate: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSale, setCreatedSale] = useState<{ saleId: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      buyerId: currentUser?.id || undefined as number | undefined,
      sellerId: undefined as number | undefined,
      productId: undefined as number | undefined,
      quantity: 1,
      paymentProofUrl: '',
    } as SaleFormData,
  });

  const watchedProductId = watch('productId');
  const watchedQuantity = watch('quantity') || 1;

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (watchedProductId) {
      const product = products.find((p) => p.productId === watchedProductId);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [watchedProductId, products]);

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const productsData = await productService.getAllProducts();
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * watchedQuantity;
  };

  const onSubmit = async (data: SaleFormData) => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const totalAmount = calculateTotal();
      
      // Get affiliate info if available
      const affiliateInfo = affiliateUtils.getAffiliate();
      
      const saleData: CreateSaleRequest = {
        buyerId: data.buyerId,
        sellerId: data.sellerId && data.sellerId > 0 ? data.sellerId : undefined,
        // affiliateUserId: affiliateInfo?.affiliateUserId,
        productId: data.productId,
        quantity: data.quantity,
        paymentProofUrl: data.paymentProofUrl,
        amount: totalAmount,
      };
      const sale = await saleService.createSale(saleData);
      setCreatedSale({ saleId: sale.id });
      setShowSuccessModal(true);
      reset();
      setSelectedProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <Container className="sale-create-container">
      <div className="page-header mb-4">
        <Button variant="outline-secondary" onClick={() => navigate('/sales')} className="mb-3">
          ← Back to Sales
        </Button>
        <h2 className="display-5 fw-bold">Create New Sale</h2>
        <p className="text-muted">Record a sale and distribute commissions automatically</p>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">📝 Sale Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {productsLoading ? (
                <Loader />
              ) : (
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Buyer ID <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          size="lg"
                          {...register('buyerId', {
                            required: 'Buyer ID is required',
                            min: { value: 1, message: 'Buyer ID must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Enter buyer user ID"
                          isInvalid={!!errors.buyerId}
                        />
                        {currentUser && (
                          <Form.Text className="text-muted">
                            Currently logged in as: {currentUser.username} (ID: {currentUser.id})
                          </Form.Text>
                        )}
                        <Form.Control.Feedback type="invalid">
                          {errors.buyerId?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Seller ID (Referrer - Optional)</Form.Label>
                        <Form.Control
                          type="number"
                          size="lg"
                          {...register('sellerId', {
                            min: { value: 1, message: 'Seller ID must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Enter referrer/seller user ID"
                          isInvalid={!!errors.sellerId}
                        />
                        <Form.Text className="text-muted">
                          Leave empty if no referral involved
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.sellerId?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Product <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      size="lg"
                      {...register('productId', {
                        required: 'Product selection is required',
                        valueAsNumber: true,
                      })}
                      isInvalid={!!errors.productId}
                    >
                      <option value="">Select a product...</option>
                      {products.map((product) => (
                        <option key={product.productId} value={product.productId}>
                          {product.name} - ₹{product.price.toFixed(2)}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.productId?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {selectedProduct && (
                    <BootstrapAlert variant="info" className="mb-3">
                      <div className="d-flex align-items-center">
                        {selectedProduct.imageUrl && (
                          <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="selected-product-image me-3"
                          />
                        )}
                        <div>
                          <strong>{selectedProduct.name}</strong>
                          {selectedProduct.description && (
                            <div className="small text-muted">{selectedProduct.description}</div>
                          )}
                          <div className="mt-1">
                            <Badge bg="success" className="fs-6">
                              ₹{selectedProduct.price.toFixed(2)} per unit
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </BootstrapAlert>
                  )}

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Quantity <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          size="lg"
                          min="1"
                          {...register('quantity', {
                            required: 'Quantity is required',
                            min: { value: 1, message: 'Quantity must be at least 1' },
                            valueAsNumber: true,
                          })}
                          isInvalid={!!errors.quantity}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.quantity?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Payment Proof <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          size="lg"
                          {...register('paymentProofUrl', {
                            required: 'Payment Proof is required',
                            minLength: { value: 1, message: 'Payment Proof cannot be empty' },
                          })}
                          placeholder="Enter payment Payment Proof"
                          isInvalid={!!errors.paymentProofUrl}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.paymentProofUrl?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <Button variant="outline-secondary" size="lg" onClick={() => navigate('/sales')}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="lg" type="submit" disabled={loading || !selectedProduct}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Creating Sale...
                        </>
                      ) : (
                        '✨ Create Sale'
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">💰 Order Summary</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {selectedProduct ? (
                <>
                  <div className="summary-item mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Product:</span>
                      <strong>{selectedProduct.name}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Unit Price:</span>
                      <strong>₹{selectedProduct.price.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Quantity:</span>
                      <strong>{watchedQuantity}</strong>
                    </div>
                    <hr className="my-3" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="h5 mb-0">Total Amount:</span>
                      <span className="h3 fw-bold text-success mb-0">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <BootstrapAlert variant="info" className="mb-0">
                    <small>
                      <strong>💡 Note:</strong> Commissions will be automatically distributed to the referral chain
                      (up to 10 levels) when this sale is created.
                    </small>
                  </BootstrapAlert>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <div className="mb-2" style={{ fontSize: '3rem' }}>
                    📦
                  </div>
                  <p>Select a product to see order summary</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>🎉 Sale Created Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="text-center mb-4">
            <div className="display-1 mb-3">✅</div>
            <h4>Sale has been recorded!</h4>
            <p className="text-muted">Commissions have been distributed to the referral chain.</p>
          </div>
          {createdSale && (
            <Card className="bg-light">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Sale ID:</span>
                  <Badge bg="primary" className="fs-6">{createdSale.saleId}</Badge>
                </div>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
          <Button
            variant="success"
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/sales');
            }}
          >
            View All Sales
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
              reset();
              setSelectedProduct(null);
            }}
          >
            Create Another Sale
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SaleCreate;
