import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert as BootstrapAlert } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert/Alert';
import './Cart.css';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      setError('Your cart is empty. Add some products first!');
      return;
    }

    // For now, we'll navigate to a checkout page or handle multiple items
    // Since the current order flow is single-item, we'll show a message
    // In a full implementation, you'd create a multi-item checkout flow
    setError('Multi-item checkout is coming soon! For now, please order items one at a time.');
    
    // Alternative: Navigate to first item's order page
    // if (items.length > 0) {
    //   navigate(`/orders/${items[0].productId}?quantity=${items[0].quantity}`);
    // }
  };

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
  };

  if (items.length === 0) {
    return (
      <Container className="cart-container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center shadow-sm border-0">
              <Card.Body className="py-5">
                <div className="empty-cart-icon mb-4">🛒</div>
                <h3 className="fw-bold mb-3">Your Cart is Empty</h3>
                <p className="text-muted mb-4">
                  Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
                </p>
                <Button variant="primary" size="lg" onClick={() => navigate('/products')}>
                  Browse Products
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  const cartTotal = getCartTotal();

  return (
    <Container className="cart-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Shopping Cart</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Cart Items ({items.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '100px' }}>Image</th>
                    <th>Product</th>
                    <th style={{ width: '120px' }}>Price</th>
                    <th style={{ width: '150px' }}>Quantity</th>
                    <th style={{ width: '120px' }}>Subtotal</th>
                    <th style={{ width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop'}
                          alt={item.productName}
                          className="cart-item-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop';
                          }}
                        />
                      </td>
                      <td>
                        <div className="cart-item-name">{item.productName}</div>
                      </td>
                      <td>
                        <div className="cart-item-price">₹{item.price.toFixed(2)}</div>
                      </td>
                      <td>
                        <div className="quantity-controls">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          >
                            −
                          </Button>
                          <span className="quantity-value">{item.quantity}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td>
                        <div className="cart-item-subtotal fw-bold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-end mb-4">
            <Button variant="outline-danger" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="order-summary-item mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                  <strong>₹{cartTotal.toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping:</span>
                  <span className="text-success">Free</span>
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
                  className="fw-semibold"
                >
                  Proceed to Checkout
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/products')}>
                  Continue Shopping
                </Button>
              </div>

              <div className="mt-3">
                <small className="text-muted">
                  <strong>Note:</strong> Currently, orders are processed one item at a time. Multi-item checkout is
                  coming soon!
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;

