import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Modal, Badge } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import { saleService } from '../../api/saleService';
import { productService } from '../../api/productService';
import { CreateSaleRequest, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { authUtils } from '../../utils/auth';
import { affiliateUtils } from '../../utils/affiliate';
import Loader from '../../components/Loader/Loader';
import Alert from '../../components/Alert/Alert';
import './OrderPage.css';

interface OrderFormData {
  paymentProofUrl: string;
  quantity: number;
}

// UPI ID - can be configured via environment variable
const UPI_ID = process.env.REACT_APP_UPI_ID || 'your-vpa@bank';
const MERCHANT_NAME = process.env.REACT_APP_MERCHANT_NAME || 'Divaksha';

const OrderPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSale, setCreatedSale] = useState<{ saleId: number } | null>(null);
  
  // Get sellerId from URL ref parameter or localStorage
  const refParam = searchParams.get('ref');
  const sellerId = refParam ? parseInt(refParam, 10) : authUtils.getReferralId();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      quantity: 1,
      paymentProofUrl: '',
    } as OrderFormData,
  });

  const watchedQuantity = watch('quantity') || 1;

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const productData = await productService.getProductById(parseInt(productId));
      setProduct(productData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!product) return 0;
    return product.price * watchedQuantity;
  };

  const upiUri = product
    ? `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${calculateTotal()}&cu=INR`
    : '';

  const onSubmit = async (data: OrderFormData) => {
    if (!product || !currentUser) {
      setError('Please login to place an order');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const totalAmount = calculateTotal();
      
      // Get affiliate info from cookie/localStorage
      const affiliateInfo = affiliateUtils.getAffiliate();
      
      const saleData: CreateSaleRequest = {
        buyerId: currentUser.id,
        sellerId: sellerId && !isNaN(sellerId) ? sellerId : undefined,
        // affiliateUserId: affiliateInfo?.affiliateUserId,
        productId: product.productId,
        quantity: data.quantity,
        paymentProofUrl: data.paymentProofUrl,
        amount: totalAmount,
      };
      const sale = await saleService.createSale(saleData);
      setCreatedSale({ saleId: sale.id });
      setSuccess('Order placed successfully! Commissions have been distributed.');
      setShowSuccessModal(true);
      authUtils.clearReferralId(); // Clear referral after purchase
      affiliateUtils.clearAffiliate(); // Clear affiliate after purchase
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="order-page-container">
        <Loader />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="order-page-container">
        <Alert variant="danger" message="Product not found" />
        <Button variant="outline-secondary" onClick={() => navigate('/products')}>
          ← Back to Products
        </Button>
      </Container>
    );
  }

  const totalAmount = calculateTotal();

  return (
    <Container className="order-page-container">
      <Button variant="outline-secondary" onClick={() => navigate('/products')} className="mb-3">
        ← Back to Products
      </Button>

      <h2>Place Order</h2>
      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}
      {success && (
        <Alert variant="success" message={success} onClose={() => setSuccess(null)} autoHide />
      )}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h4>{product.name}</h4>
            </Card.Header>
            <Card.Body>
              {product.imageUrl && (
                <div className="product-image-container mb-3">
                  <img src={product.imageUrl} alt={product.name} className="product-image-large" />
                </div>
              )}
              {product.description && <p className="mb-3">{product.description}</p>}
              <p className="product-price">Price: ₹{product.price.toFixed(2)}</p>
              <div className="qr-code-container">
                <QRCodeSVG value={upiUri} size={256} />
              </div>
              <div className="upi-instructions mt-3">
                <h6>Payment Instructions:</h6>
                <ol>
                  <li>Scan the QR code above with your UPI app</li>
                  <li>Complete the payment of ₹{totalAmount.toFixed(2)}</li>
                  <li>Copy the Payment Proof from your payment app</li>
                  <li>Enter the Payment Proof in the form below</li>
                </ol>
                <p className="text-muted">
                  <strong>UPI ID:</strong> {UPI_ID}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>Order Form</h4>
            </Card.Header>
            <Card.Body>
              {!currentUser && (
                <Alert
                  variant="warning"
                  message="Please login to place an order. Redirecting to registration..."
                  onClose={() => {}}
                />
              )}
              {sellerId && !isNaN(sellerId) && (
                <Alert
                  variant="info"
                  message={`Purchase through referral link (Referrer ID: ${sellerId}). Commissions will be distributed!`}
                  onClose={() => {}}
                />
              )}
              {affiliateUtils.getAffiliate() && (
                <Alert
                  variant="success"
                  message={`Affiliate tracking active! You'll earn commission on this purchase.`}
                  onClose={() => {}}
                />
              )}
              <Form onSubmit={handleSubmit(onSubmit)}>
                {currentUser && (
                  <div className="mb-3 p-2 bg-light rounded">
                    <small className="text-muted">Buying as: </small>
                    <strong>{currentUser.username}</strong> (ID: {currentUser.id})
                  </div>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
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

                <div className="order-summary mb-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Unit Price:</span>
                    <strong>₹{product.price.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Quantity:</span>
                    <strong>{watchedQuantity}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="h5">Total Amount:</span>
                    <strong className="h5 text-success">₹{totalAmount.toFixed(2)}</strong>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Proof *</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('paymentProofUrl', {
                      required: 'Payment Proof is required',
                      minLength: { value: 1, message: 'Payment Proof cannot be empty' },
                    })}
                    placeholder="Enter UPI Payment Proof"
                    isInvalid={!!errors.paymentProofUrl}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.paymentProofUrl?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button variant="primary" type="submit" disabled={submitting} className="w-100">
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>🎉 Order Placed Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Your order has been placed and commissions have been distributed!</p>
          <p>
            <strong>Sale ID:</strong> {createdSale?.saleId}
          </p>
          <p className="text-muted">
            Check your dashboard to see your commissions and referral earnings.
          </p>
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

export default OrderPage;

