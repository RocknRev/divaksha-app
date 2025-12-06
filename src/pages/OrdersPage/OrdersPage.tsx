import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Modal, Badge, Alert as BootstrapAlert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import { orderService } from '../../api/orderService';
import { productService } from '../../api/productService';
import { CreateOrderRequest, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert/Alert';
import Loader from '../../components/Loader/Loader';
import './OrdersPage.css';

interface OrderFormData {
  doorNo: any;
  area: any;
  landmark: any;
  city: any;
  district: any;
  pincode: any;
  quantity: number;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryEmail: string;
}

const AFFILIATE_CODE_STORAGE_KEY = 'affiliateCode';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// UPI ID - can be configured via environment variable
const UPI_ID = process.env.REACT_APP_UPI_ID || 'your-vpa@bank';
const MERCHANT_NAME = process.env.REACT_APP_MERCHANT_NAME || 'Divaksha';

const OrdersPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ orderId: number } | null>(null);
  
  // Two-step flow state
  const [step, setStep] = useState<1 | 2>(1);
  const [deliveryData, setDeliveryData] = useState<OrderFormData | null>(null);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      quantity: 1,
      deliveryName: currentUser?.username || '',
      deliveryPhone: currentUser?.phone || '',
      deliveryEmail: currentUser?.email || '',
      deliveryAddress: '',
      landmark:'',
      city:'',
      district:'',
      pincode:'',
    } as OrderFormData,
  });

  const watchedQuantity = watch('quantity') || 1;

  useEffect(() => {
    if (productId) {
      loadProduct();
    } else {
      setError('Product ID is required');
      setLoading(false);
    }
  }, [productId]);

  // Update form defaults when currentUser changes
  useEffect(() => {
    if (currentUser && step === 1) {
      reset({
        quantity: 1,
        deliveryName: currentUser.username || '',
        deliveryPhone: currentUser.phone || '',
        deliveryEmail: currentUser.email || '',
        deliveryAddress: '',
      });
    }
  }, [currentUser, reset, step]);

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

  const calculateTotal = () => {
    if (!product) return 0;
    return product.price * watchedQuantity;
  };

  const upiUri = product
    ? `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${calculateTotal()}&cu=INR`
    : '';

  // Step 1: Submit delivery details
  const onStep1Submit = async (data: OrderFormData) => {
    if (!product) {
      setError('Please choose a valid product to place an order');
      return;
    }
    const addressParts = [
      data.doorNo?.trim(),
      data.area?.trim(),
      data.landmark?.trim(),
      `${data.city?.trim()}, ${data.district?.trim()} - ${data.pincode?.trim()}`
    ].filter(Boolean); // remove empty
  
    const deliveryAddress = addressParts.join(', ');

    setDeliveryData({ ...data, deliveryAddress });
    setStep(2);
    setError(null);
  };

  // Step 2: Handle payment proof upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPaymentProofError(null);

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPaymentProofError('Please upload a valid image file (PNG, JPG, or JPEG)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setPaymentProofError('File size must be less than 2MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const compressed = await compressImage(file);

      console.log("Compressed size KB:", Math.round(compressed.length / 1024));
  
      setPaymentProof(compressed);
      // setPaymentProof(base64String);
    };
    reader.onerror = () => {
      setPaymentProofError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Confirm and place order
  const onStep2Submit = async () => {
    if (!product || !deliveryData) {
      setError('Missing order information');
      return;
    }

    if (!paymentProof) {
      setPaymentProofError('Please upload payment proof screenshot');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setPaymentProofError(null);
      const totalAmount = calculateTotal();

      // Get affiliateCode from localStorage
      const affiliateCode = localStorage.getItem(AFFILIATE_CODE_STORAGE_KEY);

      const orderData: CreateOrderRequest = {
        buyerId: currentUser?.id,
        sellerId: currentUser?.id,
        productId: product.productId,
        quantity: deliveryData.quantity,
        paymentProofUrl: paymentProof,
        amount: totalAmount,
        affiliateCode: affiliateCode || undefined,
        deliveryName: deliveryData.deliveryName,
        deliveryPhone: deliveryData.deliveryPhone,
        deliveryAddress: deliveryData.deliveryAddress,
        deliveryEmail: deliveryData.deliveryEmail
      };

      const order = await orderService.createOrder(orderData);
      setCreatedOrder({ orderId: order.orderId });
      setSuccess('Order created successfully! Your order is pending payment approval.');
      setShowOrderModal(true);
      
      // Clear affiliate code after order creation
      if (affiliateCode) {
        localStorage.removeItem(AFFILIATE_CODE_STORAGE_KEY);
      }
      
      // Reset form
      setStep(1);
      setPaymentProof(null);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setPaymentProof(null);
    setPaymentProofError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <Container className="orders-page-container">
        <Loader />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="orders-page-container">
        <Alert variant="danger" message="Product not found" onClose={() => navigate('/products')} />
      </Container>
    );
  }

  return (
    <Container className="orders-page-container py-4">
      {/* Affiliate Alert */}
      {localStorage.getItem(AFFILIATE_CODE_STORAGE_KEY) && (
        <BootstrapAlert variant="info" className="mb-4" dismissible>
          <BootstrapAlert.Heading>🎯 Affiliate Tracking Active</BootstrapAlert.Heading>
          <p className="mb-0">Commission will be distributed on purchase!</p>
        </BootstrapAlert>
      )}

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} autoHide />}

      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-center gap-3">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Delivery Details</span>
            </div>
            <div className="step-connector"></div>
            <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Payment</span>
            </div>
          </div>
        </Col>
      </Row>

      {step === 1 ? (
        // STEP 1: Delivery Details Form
        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-primary text-white py-3">
                <h4 className="mb-0 fw-bold">📦 Delivery Information</h4>
              </Card.Header>
              <Card.Body className="p-4">
                {/* Product Summary */}
                <div className="product-summary-card mb-4 p-3 bg-light rounded">
                  <Row className="align-items-center">
                    <Col md={3} className="text-center">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop'}
                        alt={product.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '120px', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop';
                        }}
                      />
                    </Col>
                    <Col md={9}>
                      <h5 className="fw-bold mb-2">{product.name}</h5>
                      {product.description && (
                        <p className="text-muted small mb-2">{product.description.substring(0, 100)}...</p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg="success" className="fs-5 px-3 py-2">
                          ₹{product.price.toFixed(2)} per unit
                        </Badge>
                        <div className="text-end">
                          <p className="mb-0 text-muted small">Quantity: {watchedQuantity}</p>
                          <p className="mb-0 fw-bold fs-5 text-primary">
                            Total: ₹{calculateTotal().toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                <Form onSubmit={handleSubmit(onStep1Submit)}> 
                  
                  <Form.Group className="mb-3"> 
                    <Form.Label className="fw-semibold"> Quantity <span className="text-danger">*</span> </Form.Label> 
                    <Form.Control type="number" min="1" {...register('quantity', { required: 'Quantity is required', min: { value: 1, message: 'Quantity must be at least 1' }, valueAsNumber: true, })} isInvalid={!!errors.quantity} className="form-control-lg" /> 
                    <Form.Control.Feedback type="invalid"> {errors.quantity?.message} </Form.Control.Feedback> 
                  </Form.Group> <hr className="my-4" /> 
                  <Form.Group className="mb-3"> 
                    <Form.Label className="fw-semibold"> Full Name <span className="text-danger">*</span> </Form.Label> 
                    <Form.Control type="text" {...register('deliveryName', { required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' }, })} placeholder="Enter your full name" isInvalid={!!errors.deliveryName} className="form-control-lg" /> 
                    <Form.Control.Feedback type="invalid"> {errors.deliveryName?.message} </Form.Control.Feedback> 
                  </Form.Group> 
                  <Form.Group className="mb-3"> 
                    <Form.Label className="fw-semibold"> Email Address <span className="text-danger">*</span> </Form.Label> 
                    <Form.Control type="text" {...register('deliveryEmail', { required: 'Email address is required', minLength: { value: 2, message: 'Enter Valid Email' }, })} placeholder="Enter your email address" isInvalid={!!errors.deliveryEmail} className="form-control-lg" /> 
                    <Form.Control.Feedback type="invalid"> {errors.deliveryEmail?.message} </Form.Control.Feedback> 
                  </Form.Group> 
                  <Form.Group className="mb-3"> 
                    <Form.Label className="fw-semibold"> Contact Phone <span className="text-danger">*</span> </Form.Label> 
                    <Form.Control type="tel" {...register('deliveryPhone', { required: 'Phone number is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit mobile number', }, })} placeholder="Enter 10-digit mobile number" isInvalid={!!errors.deliveryPhone} className="form-control-lg" /> 
                    <Form.Control.Feedback type="invalid"> {errors.deliveryPhone?.message} </Form.Control.Feedback> 
                  </Form.Group>
                  {/* Door/Flat No */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Door / Flat No <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      {...register('doorNo', {
                        required: 'This field is required',
                        minLength: { value: 1, message: 'Invalid value' },
                      })}
                      placeholder="e.g. #12, 2nd Floor"
                      isInvalid={!!errors.doorNo}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.doorNo?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Area / Street */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Area / Street <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      {...register('area', {
                        required: 'Area / Street is required',
                        minLength: { value: 3, message: 'Too short' },
                      })}
                      placeholder="e.g. Gandhi Nagar"
                      isInvalid={!!errors.area}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.area?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Landmark (optional) */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Landmark (optional)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      {...register('landmark')}
                      placeholder="e.g. Near SBI Bank"
                      className="form-control-lg"
                    />
                  </Form.Group>

                  {/* City */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      City <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      {...register('city', {
                        required: 'City is required',
                      })}
                      placeholder="Enter city"
                      isInvalid={!!errors.city}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.city?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* District */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      District <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      {...register('district', {
                        required: 'District is required',
                      })}
                      placeholder="Enter district"
                      isInvalid={!!errors.district}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.district?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Pincode */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      Pincode <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      maxLength={6}
                      {...register('pincode', {
                        required: 'Pincode is required',
                        pattern: {
                          value: /^[1-9][0-9]{5}$/,
                          message: 'Enter a valid 6-digit pincode',
                        },
                      })}
                      placeholder="6-digit pincode"
                      isInvalid={!!errors.pincode}
                      className="form-control-lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.pincode?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" size="lg" className="fw-semibold py-3">
                      Continue to Payment →
                    </Button>
                    <Button variant="outline-secondary" onClick={() => navigate('/products')} size="lg">
                      ← Back to Products
                    </Button>
                  </div>
                </Form>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        // STEP 2: Payment & Screenshot Upload
        <Row>
          <Col lg={10} className="mx-auto">
            <Card className="shadow-lg border-0 mb-4">
              <Card.Header className="bg-success text-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 fw-bold">💳 Complete Payment</h4>
                  <Button variant="light" size="sm" onClick={handleBackToStep1}>
                    ← Edit Details
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  {/* UPI QR Section */}
                  <Col md={6} className="mb-4">
                    <div className="payment-section">
                      <h5 className="fw-bold mb-3">Scan & Pay</h5>
                      <div className="qr-code-container text-center bg-light p-4 rounded mb-3">
                        <QRCodeSVG value={upiUri} size={240} />
                      </div>
                      <div className="payment-info p-3 bg-light rounded">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Amount:</span>
                          <strong className="fs-5 text-primary">₹{calculateTotal().toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">UPI ID:</span>
                          <code className="text-primary">{UPI_ID}</code>
                        </div>
                      </div>
                      <div className="upi-instructions mt-3 p-3 bg-info bg-opacity-10 rounded">
                        <h6 className="fw-bold mb-2">Payment Instructions:</h6>
                        <ol className="mb-0 small">
                          <li>Open your UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
                          <li>Scan the QR code above</li>
                          <li>Complete the payment of ₹{calculateTotal().toFixed(2)}</li>
                          <li>Take a screenshot of the payment confirmation</li>
                          <li>Upload the screenshot below</li>
                        </ol>
                      </div>
                    </div>
                  </Col>

                  {/* Screenshot Upload Section */}
                  <Col md={6}>
                    <div className="upload-section">
                      <h5 className="fw-bold mb-3">📷 Upload Payment Proof</h5>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Payment Screenshot <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleFileChange}
                          isInvalid={!!paymentProofError}
                          className="form-control-lg"
                        />
                        <Form.Control.Feedback type="invalid">
                          {paymentProofError}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Upload PNG, JPG, or JPEG (Max 5MB)
                        </Form.Text>
                      </Form.Group>

                      {paymentProof && (
                        <div className="preview-container mb-3">
                          <p className="small text-muted mb-2">Preview:</p>
                          <div className="image-preview-wrapper">
                            <img
                              src={paymentProof}
                              alt="Payment proof preview"
                              className="img-fluid rounded shadow-sm"
                              style={{ maxHeight: '200px', width: 'auto' }}
                            />
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setPaymentProof(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="order-summary-card p-3 bg-light rounded mb-3">
                        <h6 className="fw-bold mb-2">Order Summary</h6>
                        <div className="small">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Product:</span>
                            <strong>{product.name}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Quantity:</span>
                            <strong>{deliveryData?.quantity || 1}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Delivery To:</span>
                            <strong>{deliveryData?.deliveryAddress}</strong>
                          </div>
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold">Total Amount:</span>
                            <strong className="fs-5 text-primary">₹{calculateTotal().toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <Button
                          variant="success"
                          size="lg"
                          onClick={onStep2Submit}
                          disabled={!paymentProof || submitting}
                          className="fw-semibold py-3"
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Placing Order...
                            </>
                          ) : (
                            '✅ Confirm & Place Order'
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={handleBackToStep1}
                          size="lg"
                        >
                          ← Back to Details
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Success Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="fw-bold">✅ Order Created Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="text-center mb-4">
            <div className="display-6 mb-2">🎉</div>
            <h4 className="fw-bold">Thank You for Your Order!</h4>
          </div>
          <div className="order-details-card p-3 bg-light rounded mb-3">
            <p className="mb-2"><strong>Order ID:</strong> <code className="fs-5">#{createdOrder?.orderId}</code></p>
            <p className="mb-2"><strong>Product:</strong> {product.name}</p>
            <p className="mb-2"><strong>Quantity:</strong> {deliveryData?.quantity || watchedQuantity}</p>
            <p className="mb-2"><strong>Total Amount:</strong> ₹{calculateTotal().toFixed(2)}</p>
            <p className="mb-2"><strong>Delivery To:</strong> {deliveryData?.deliveryName}</p>
            <p className="mb-2"><strong>Delivery Address:</strong> {deliveryData?.deliveryAddress}</p>
          </div>
          <BootstrapAlert variant="info" className="mb-0">
            <strong>Status: PENDING</strong>
            <p className="mb-0 small">
              Your order is pending payment approval. An admin will verify your payment screenshot and mark it as paid.
              Commissions will be distributed automatically once the order is approved.
            </p>
          </BootstrapAlert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size="lg" onClick={() => {
            setShowOrderModal(false);
            navigate('/dashboard');
          }}>
            Go to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrdersPage;

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(err);
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;

      // Resize based on width
      if (width > 1080) {
        height = (1080 / width) * height;
        width = 1080;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      // Compress to JPEG
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

      resolve(compressedBase64);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};
