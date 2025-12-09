import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert as BootstrapAlert, Modal, Form } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../api/orderService';
import { CreateOrderRequest, OrderResponse } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import Alert from '../../components/Alert/Alert';
import './Cart.css';

const AFFILIATE_CODE_STORAGE_KEY = 'affiliateCode';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const UPI_ID = process.env.REACT_APP_UPI_ID || 'rakesh.isl2025@okhdfcbank';
const MERCHANT_NAME = process.env.REACT_APP_MERCHANT_NAME || 'Divaksha';

interface DeliveryFormData {
  doorNo: any;
  area: any;
  landmark: any;
  city: any;
  district: any;
  pincode: any;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryEmail: string;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Checkout flow state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      deliveryName: currentUser?.username || '',
      deliveryPhone: currentUser?.phone || '',
      deliveryEmail: currentUser?.email || '',
      doorNo: '',
      area: '',
      landmark: '',
      city: '',
      district: '',
      pincode: '',
    } as DeliveryFormData
  });

  const handleQuantityChange = (productId: number, newQuantity: number, stock?: number) => {
    if (stock !== undefined && stock < 1) {
      setError("This item is out of stock");
      return;
    }
  
    if (stock !== undefined && newQuantity > stock) {
      setError(`Only ${stock} units available`);
      return;
    }
  
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };  

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
  };

  const handleCheckout = () => {
    const outOfStockItem = items.find((i) => !i.stock || i.stock < 1);
    if (outOfStockItem) {
      setError(`"${outOfStockItem.productName}" is out of stock. Please remove it to continue.`);
      return;
    }
    const stockExceededItem = items.find((i) => i.quantity > (i.stock ?? 0));
    if (stockExceededItem) {
      setError(`Only ${stockExceededItem.stock} units available for "${stockExceededItem.productName}".`);
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty. Add some products first!');
      return;
    }

    if (!currentUser) {
      setError('Please login to proceed with checkout');
      return;
    }

    setShowCheckoutModal(true);
    setCheckoutStep(1);
    setError(null);
    setSuccess(null);
    reset({
      deliveryName: currentUser.username || '',
      deliveryPhone: currentUser.phone || '',
      deliveryEmail: currentUser.email || '',
      doorNo: '',
      area: '',
      landmark: '',
      city: '',
      district: '',
      pincode: '',
    });
  };

  const onStep1Submit = async (data: DeliveryFormData) => {
    const addressParts = [
      data.doorNo?.trim(),
      data.area?.trim(),
      data.landmark?.trim(),
      `${data.city?.trim()}, ${data.district?.trim()} - ${data.pincode?.trim()}`,
    ].filter(Boolean);

    const deliveryAddress = addressParts.join(', ');

    setDeliveryData({ ...data, deliveryAddress: deliveryAddress });
    setCheckoutStep(2);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaymentProofError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPaymentProofError('Please upload a valid image file (PNG, JPG, or JPEG)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPaymentProofError('File size must be less than 2MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(file);
        setPaymentProof(compressed);
      } catch (err) {
        setPaymentProofError('Failed to process image. Please try again.');
      }
    };
    reader.onerror = () => {
      setPaymentProofError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const onStep2Submit = async () => {
    if (!deliveryData || !paymentProof) {
      setPaymentProofError('Please upload payment proof screenshot');
      return;
    }

    if (!currentUser) {
      setError('Please login to proceed');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setPaymentProofError(null);

      const cartTotal = getCartTotal();
      const affiliateCode = localStorage.getItem(AFFILIATE_CODE_STORAGE_KEY);
      
      // Get sellerId from referral if available
      const refParam = new URLSearchParams(window.location.search).get('ref');
      const sellerId = refParam ? parseInt(refParam, 10) : null;

      const orderData: CreateOrderRequest = {
        buyerId: currentUser.id,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          sellerId: sellerId && !isNaN(sellerId) ? sellerId : null,
        })),
        totalAmount: cartTotal,
        paymentProofUrl: paymentProof,
        deliveryAddress: deliveryData.deliveryAddress,
        deliveryPhone: deliveryData.deliveryPhone,
        deliveryName: deliveryData.deliveryName,
        deliveryEmail: deliveryData.deliveryEmail,
        affiliateCode: affiliateCode || null,
      };

      const order = await orderService.submitOrder(orderData);
      setCreatedOrder(order);
      setShowSuccessModal(true);
      setShowCheckoutModal(false);

      // Clear affiliate code
      if (affiliateCode) {
        localStorage.removeItem(AFFILIATE_CODE_STORAGE_KEY);
      }

      // Reset checkout state
      setCheckoutStep(1);
      setDeliveryData(null);
      setPaymentProof(null);
      reset();
      
      // Clear cart after showing success (cart will be cleared when modal closes or user navigates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit order';
      setError(errorMessage);
      setShowFailureModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToStep1 = () => {
    setCheckoutStep(1);
    setPaymentProof(null);
    setPaymentProofError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseCheckout = () => {
    if (!submitting) {
      setShowCheckoutModal(false);
      setCheckoutStep(1);
      setDeliveryData(null);
      setPaymentProof(null);
      setPaymentProofError(null);
      reset();
      // Don't clear cart here - only clear on successful order navigation
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Clear cart when success modal is closed
    clearCart();
  };

  const handleViewOrders = () => {
    setShowSuccessModal(false);
    // Clear cart before navigating
    clearCart();
    navigate('/orders');
  };

  const handleContinueShopping = () => {
    setShowSuccessModal(false);
    // Clear cart before navigating
    clearCart();
    navigate('/products');
  };

  const cartTotal = getCartTotal();
  const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${cartTotal.toFixed(2)}&cu=INR`;

  if (items.length === 0) {
    return (
      <Container className="cart-container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center shadow-sm border-0 modern-card">
              <Card.Body className="py-5">
                <div className="empty-cart-icon mb-4">🛒</div>
                <h3 className="fw-bold mb-3">Your Cart is Empty</h3>
                <p className="text-muted mb-4">
                  Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
                </p>
                <Button variant="primary" size="lg" onClick={() => navigate('/products')} className="modern-button">
                  Browse Products
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <Container className="cart-container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold modern-heading">Shopping Cart</h2>
          <Button variant="outline-secondary" onClick={() => navigate('/products')} className="modern-button">
            Continue Shopping
          </Button>
        </div>

        {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}
        {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} autoHide />}

        <Row>
          <Col lg={8}>
            <Card className="shadow-sm border-0 mb-4 modern-card">
              <Card.Header className="bg-light modern-card-header">
                <h5 className="mb-0 fw-semibold">Cart Items ({items.length})</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0 cart-table">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '100px' }}>Image</th>
                      <th>Product</th>
                      <th style={{ width: '100px' }}>Price</th>
                      <th style={{ width: '150px' }}>Quantity</th>
                      <th style={{ width: '120px' }}>Subtotal</th>
                      <th style={{ width: '80px' }}>Stock</th>
                      <th style={{ width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      if (item.stock !== undefined && item.quantity > item.stock) {
                        updateQuantity(item.productId, item.stock);
                        setError(`Stock updated for "${item.productName}". Quantity adjusted.`);
                      }

                      const isOutOfStock = item.stock < 1;
                      const isLowStock = !isOutOfStock && item.stock < 5;

                      return (
                        <tr key={item.productId}>
                          <td>
                            <img
                              src={item.imageUrl || '/images/Tycon-G-1-Prash.png'}
                              alt={item.productName}
                              className="cart-item-image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/Tycon-G-1-Prash.png';
                              }}
                            />
                          </td>

                          <td>
                            <div className="cart-item-name">{item.productName}</div>

                            {/* STOCK LABELS */}
                            {isOutOfStock ? (
                              <Badge bg="danger" className="mt-1">Out of Stock</Badge>
                            ) : isLowStock ? (
                              <Badge bg="warning" className="mt-1 text-dark">Only {item.stock} left</Badge>
                            ) : (
                              <Badge bg="success" className="mt-1">In Stock</Badge>
                            )}
                          </td>

                          <td>
                            <div className="cart-item-price">₹{item.price.toFixed(2)}</div>
                          </td>

                          <td>
                            <div className="quantity-controls d-flex align-items-center gap-2">

                              {/* Quantity number */}
                              <div className="quantity-value-box px-3 py-1 border rounded fw-bold">
                                {item.quantity}
                              </div>

                              {/* Up/Down buttons (vertical) */}
                              <div className="d-flex flex-column">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  disabled={isOutOfStock || item.quantity >= item.stock}
                                  onClick={() =>
                                    handleQuantityChange(item.productId, item.quantity + 1, item.stock)
                                  }
                                  className="quantity-arrow-btn p-0"
                                  style={{ width: "18px", height: "14px", lineHeight: "10px" }}
                                >
                                  ▲
                                </Button>

                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  disabled={isOutOfStock}
                                  onClick={() =>
                                    handleQuantityChange(item.productId, item.quantity - 1, item.stock)
                                  }
                                  className="quantity-arrow-btn p-0 mt-1"
                                  style={{ width: "18px", height: "14px", lineHeight: "2px" }}
                                >
                                  ▼
                                </Button>
                              </div>

                            </div>
                          </td>

                          <td>
                            <div className="cart-item-subtotal fw-bold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </td>

                          <td>
                            <div className="">
                              {item.stock}
                            </div>
                          </td>
                          
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="remove-btn"
                            >
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end mb-4">
              <Button variant="outline-danger" onClick={clearCart} className="modern-button">
                Clear Cart
              </Button>
            </div>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 sticky-top modern-card" style={{ top: '20px' }}>
              <Card.Header className="bg-primary text-white modern-card-header">
                <h5 className="mb-0 fw-semibold">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="order-summary-item mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                    <strong>₹{cartTotal.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping:</span>
                    <span className="text-success fw-semibold">Free</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fs-5 fw-bold">Total:</span>
                    <span className="fs-4 fw-bold text-primary">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!currentUser && (
                  <BootstrapAlert variant="warning" className="mb-3">
                    <small>Please login to proceed with checkout</small>
                  </BootstrapAlert>
                )}

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={items.length === 0 || !currentUser}
                    className="fw-semibold modern-button modern-button-primary"
                  >
                    Proceed to Checkout
                  </Button>
                  <Button variant="outline-primary" onClick={() => navigate('/products')} className="modern-button">
                    Continue Shopping
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Checkout Modal */}
      <Modal show={showCheckoutModal} onHide={handleCloseCheckout} size="lg" centered backdrop="static">
        <Modal.Header closeButton={!submitting} className="modern-modal-header">
          <Modal.Title className="fw-bold">Checkout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Step Indicator */}
          <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
            <div className={`step-indicator ${checkoutStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Delivery Details</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step-indicator ${checkoutStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Payment</span>
            </div>
          </div>

          {checkoutStep === 1 && (
            <Form onSubmit={handleSubmit(onStep1Submit)}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="lg"
                      {...register('deliveryName', {
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      })}
                      isInvalid={!!errors.deliveryName}
                      className="modern-input"
                    />
                    <Form.Control.Feedback type="invalid">{errors.deliveryName?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Phone <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      size="lg"
                      {...register('deliveryPhone', {
                        required: 'Phone is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit phone number',
                        },
                      })}
                      isInvalid={!!errors.deliveryPhone}
                      className="modern-input"
                    />
                    <Form.Control.Feedback type="invalid">{errors.deliveryPhone?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  Email <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="email"
                  size="lg"
                  {...register('deliveryEmail', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  isInvalid={!!errors.deliveryEmail}
                  className="modern-input"
                />
                <Form.Control.Feedback type="invalid">{errors.deliveryEmail?.message}</Form.Control.Feedback>
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Door/Flat No</Form.Label>
                    <Form.Control type="text" size="lg" {...register('doorNo')} className="modern-input" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Area/Street</Form.Label>
                    <Form.Control type="text" size="lg" {...register('area')} className="modern-input" />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Landmark</Form.Label>
                <Form.Control type="text" size="lg" {...register('landmark')} className="modern-input" />
              </Form.Group>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      City <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="lg"
                      {...register('city', { required: 'City is required' })}
                      isInvalid={!!errors.city}
                      className="modern-input"
                    />
                    <Form.Control.Feedback type="invalid">{errors.city?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      District <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="lg"
                      {...register('district', { required: 'District is required' })}
                      isInvalid={!!errors.district}
                      className="modern-input"
                    />
                    <Form.Control.Feedback type="invalid">{errors.district?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Pincode <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="lg"
                      {...register('pincode', {
                        required: 'Pincode is required',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Please enter a valid 6-digit pincode',
                        },
                      })}
                      isInvalid={!!errors.pincode}
                      className="modern-input"
                    />
                    <Form.Control.Feedback type="invalid">{errors.pincode?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-grid mt-4">
                <Button type="submit" variant="primary" size="lg" className="fw-semibold modern-button modern-button-primary">
                  Continue to Payment
                </Button>
              </div>
            </Form>
          )}

          {checkoutStep === 2 && (
            <div>
              <Card className="mb-4 border-0 shadow-sm modern-card">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Order Summary</h6>
                  {items.map((item) => (
                    <div key={item.productId} className="d-flex justify-content-between mb-2">
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="fw-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total:</span>
                    <span className="fw-bold text-primary fs-5">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </Card.Body>
              </Card>

              <Card className="mb-4 border-0 shadow-sm modern-card">
                <Card.Body className="text-center">
                  <h6 className="fw-bold mb-3">Pay via UPI</h6>
                  <div className="mb-3">
                    <QRCodeSVG value={upiUri} size={200} />
                  </div>
                  <div className="mb-3">
                    <p className="mb-2 fw-semibold">UPI ID: {UPI_ID}</p>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={copyUpiId}
                      className="modern-button"
                    >
                      {copied ? '✓ Copied!' : 'Copy UPI ID'}
                    </Button>
                  </div>
                  <p className="text-muted small mb-0">
                    Scan the QR code or use the UPI ID to make payment. Upload the payment screenshot below.
                  </p>
                </Card.Body>
              </Card>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  Payment Proof Screenshot <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  isInvalid={!!paymentProofError}
                  className="modern-input"
                />
                {paymentProofError && (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {paymentProofError}
                  </Form.Control.Feedback>
                )}
                {paymentProof && (
                  <div className="mt-2">
                    <img
                      src={paymentProof}
                      alt="Payment proof"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                      className="border"
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setPaymentProof(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="mt-2 modern-button"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <Form.Text className="text-muted">Upload PNG, JPG, or JPEG (max 2MB)</Form.Text>
              </Form.Group>

              <div className="d-grid gap-2 mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onStep2Submit}
                  disabled={!paymentProof || submitting}
                  className="fw-semibold modern-button modern-button-primary"
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Submitting Order...
                    </>
                  ) : (
                    'Confirm & Place Order'
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleBackToStep1}
                  disabled={submitting}
                  className="modern-button"
                >
                  Back to Details
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered size="lg">
        <Modal.Header closeButton className="bg-success text-white modern-modal-header">
          <Modal.Title className="fw-bold">🎉 Order Placed Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createdOrder && (
            <div>
              <BootstrapAlert variant="success" className="mb-4">
                <BootstrapAlert.Heading>Order Confirmed</BootstrapAlert.Heading>
                <p className="mb-0">Your order has been placed successfully and is pending payment approval.</p>
              </BootstrapAlert>
              <Card className="border-0 shadow-sm modern-card">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Order Details</h6>
                  <div className="mb-2">
                    <strong>Order ID:</strong> <code className="fs-5">#{createdOrder.orderId}</code>
                  </div>
                  <div className="mb-2">
                    <strong>Total Amount:</strong> ₹{createdOrder.totalAmount.toFixed(2)}
                  </div>
                  <div className="mb-2">
                    <strong>Status:</strong> <Badge bg="warning">{createdOrder.status}</Badge>
                  </div>
                  <div className="mb-2">
                    <strong>Items:</strong> {createdOrder.items.length} item(s)
                    <ul className="mt-2 mb-0">
                      {createdOrder.items.map((item, idx) => (
                        <li key={idx}>
                          Product ID: {item.productId} × {item.quantity} @ ₹{item.price.toFixed(2)} each
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <strong>Delivery To:</strong> {createdOrder.deliveryName}
                  </div>
                  <div className="mb-2">
                    <strong>Delivery Address:</strong> {createdOrder.deliveryAddress}
                  </div>
                  <div className="mb-0">
                    <strong>Contact:</strong> {createdOrder.deliveryPhone} ({createdOrder.deliveryEmail})
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleContinueShopping} className="modern-button">
            Continue Shopping
          </Button>
          <Button variant="primary" onClick={handleViewOrders} className="modern-button modern-button-primary">
            View My Orders
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Failure Modal */}
      <Modal show={showFailureModal} onHide={() => setShowFailureModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white modern-modal-header">
          <Modal.Title className="fw-bold">❌ Order Failed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BootstrapAlert variant="danger" className="mb-0">
            <strong>Order submission failed!</strong>
            <p className="mb-0 mt-2">{error}</p>
            <p className="mb-0 mt-2 small">Please check your information and try again.</p>
          </BootstrapAlert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFailureModal(false)} className="modern-button">
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowFailureModal(false);
            setError(null);
          }} className="modern-button modern-button-primary">
            Try Again
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Cart;
