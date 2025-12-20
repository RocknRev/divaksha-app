import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Accordion,
  ListGroup,
  Tabs,
  Tab,
  Carousel,
  Alert as BootstrapAlert,
} from 'react-bootstrap';
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
  var isOutOfStock=false;
  useEffect(() => {
    if (productId) {
      loadProduct();
      
      if(product)
      isOutOfStock = product.stock < 1;
    } else {
      setError('Product ID is required');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // --- G1 Prash content (extracted and structured) ---
  const overviewText = [
    "Tycon’s G1 Prash is a handcrafted nutraceutical formulated with 43–50 plant-derived herbal ingredients. It focuses on addressing root causes to support overall wellness and systemic balance. The product combines traditional herbal knowledge with modern micro-clustering technology for improved absorption.",
  ];

  const highlights = [
    "Handmade formulation with plant-derived ingredients",
    "Micro-Clustering technology for better absorption",
    "Unique extraction methods",
    "Formulated blends for heart, liver, kidney, brain, reproductive and immune support",
    "No side effects",
  ];

  const benefitCards = [
    {
      icon: '💚',
      title: 'Heart Health',
      body: [
        'Supports circulation and cardiac muscle strength',
        'Helps balance cholesterol and reduce oxidative stress',
      ],
    },
    {
      icon: '🧠',
      title: 'Brain & Cognition',
      body: [
        'Improves focus and memory support',
        'Provides antioxidant nourishment for brain cells',
      ],
    },
    {
      icon: '🛡️',
      title: 'Immunity & Detox',
      body: [
        'Rich in antioxidants to support immune response',
        'Supports liver and kidney detoxification',
      ],
    },
    {
      icon: '❤️',
      title: 'Sexual & Reproductive Health',
      body: [
        'Supports stamina, hormonal balance and reproductive function',
        'Contains traditional herbs used for sexual wellness',
      ],
    },
  ];

  const ingredientBlends: { title: string; items: string[] }[] = [
    {
      title: 'Cardiac Care Blend',
      items: ['Arjun Chhal', 'Dal Chini', 'Green Elaichi', 'Kaknasha', 'Akarkara'],
    },
    {
      title: 'Brain Stimulating Blend',
      items: ['Ashwagandha', 'Badam', 'Pista', 'Pumpkin Seed', 'Khajur', 'Kaunch Beej', 'Brahmi'],
    },
    {
      title: 'Liver Tonic Blend',
      items: ['Kalmegh', 'Nagar Motha', 'Bhumi Amla', 'Raisin', 'Draksha', 'Bilva', 'Kasni', 'Kutki'],
    },
    {
      title: 'Kidney Health Blend',
      items: ['Gokhru', 'Punarnava', 'Mandukpami', 'Misri Syrup', 'Lavang', 'Beej Band'],
    },
    {
      title: 'Sexual Wellness Blend',
      items: [
        'Korean Red Ginseng',
        'Vidarikand',
        'Nag Kesar',
        'Safed Musli',
        'Shatavari',
        'Javitri',
        'Kakoli',
        'Talmakhana',
      ],
    },
    {
      title: 'Holistic Wellness / Immunity Ingredients',
      items: [
        'Giloy',
        'Pippali',
        'Dhawda Gond',
        'Shyonak',
        'Magaz-e-Nariyal',
        'Wild Honey',
        'Black Pepper',
        'Nano-technology applied gold granules',
      ],
    },
  ];

  const bodySystems = [
    'Digestive System',
    'Circulatory System',
    'Nervous System',
    'Endocrine System',
    'Respiratory System',
    'Immune System',
    'Skeletal System',
    'Muscular System',
    'Lymphatic System',
    'Urinary System',
    'Reproductive System',
  ];

  const dosageNotes = [
    {
      title: 'For Men',
      text: '1 full tablespoon (approx. 8–10 g) per day (e.g. 5 g morning and 5 g night).',
    },
    {
      title: 'For Women',
      text: '½ tablespoon (approx. 5 g) per day (2.5 g morning and 2.5 g night).',
    },
    {
      title: 'Not recommended for',
      text: 'Patients on dialysis, pregnant women, breastfeeding mothers, and women during menstrual periods.',
    },
    {
      title: 'General Guidance',
      text: 'If acidity increases initially, it may settle when body pH balances. Drink at least 3 L of water daily and include light exercise (15–20 min walking) for best results.',
    },
  ];

  const faqs = [
    {
      q: 'Are ingredients plant-based?',
      a: 'Yes. All ingredients are plant-origin/derived only.',
    },
    {
      q: 'Does it have side effects?',
      a: 'No side effects. Users with specific medical conditions should consult a healthcare professional.',
    },
    {
      q: 'How to consume?',
      a: 'Follow the dosage guidance: mix in water/juice or take directly as guided. See Dosage tab for details.',
    },
  ];

  // carousel images
  const carouselImages: string[] =
    ['/images/Tycon-G-1-Prash.png'];

  return (
    <Container className="product-details-container py-5">
      <div className="rounded-3xl bg-white/80 backdrop-blur border shadow-lg p-4">
      {/* Hero top: image carousel + purchase card */}
      <Row className="gy-4 align-items-center">
        <Col lg={7}>
          <Card className="p-3 h-100 border rounded-3 bg-light">
            <Carousel variant="dark" indicators={carouselImages.length > 1} interval={4000}>
              {carouselImages.map((src, i) => (
                <Carousel.Item key={i}>
                  <div className="d-flex justify-content-center align-items-center p-4" style={{ minHeight: 360, background: 'linear-gradient(180deg, #f8fafc, #ffffff)' }}>
                    <img
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      className="img-fluid product-detail-carousel-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          '/images/Tycon-G-1-Prash.png';
                      }}
                      style={{ maxHeight: 420, objectFit: 'contain' }}
                    />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </Card>
        </Col>

        <Col lg={5}>
        <Card className="p-3 h-100 border rounded-3 bg-light">
            <div className="d-flex align-items-start justify-content-between mb-2">
              <div>
                {isOutOfStock ? (
                  <Badge bg="danger">Out of Stock</Badge>
                ) : (
                  <Badge bg="success">In Stock</Badge>
                )}
              </div>
              <div className="text-end">
                <small className="text-muted">SKU: {product.sku || '—'}</small>
              </div>
            </div>

            <h2 className="product-title mb-2 fw-bold">{product.name}</h2>
            <div className="mb-3">
              <span className="product-price h3 fw-bold">₹{product.price.toFixed(2)}</span>
              <div className="text-muted small">per unit</div>
            </div>
            <div className={`fw-semibold mt-1 ${isOutOfStock ? "text-danger" : "text-success"}`}>
              {isOutOfStock ? "Currently Unavailable" : `Available Stock: ${product.stock}`}
            </div>


            {/* Short description */}
            {product.description && <p className="text-muted mb-3">{product.description}</p>}

            {/* Quantity and actions */}
            <div className="d-flex align-items-center justify-content-between rounded-3 border px-3 py-2">
            <Row className="align-items-center gy-2">
              <Col xs="auto">
                <div className="d-flex align-items-center border rounded-3 px-2 py-1">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    −
                  </Button>
                  <div className="px-3 mx-2 fw-bold fs-5">{quantity}</div>
                  <Button variant="light" size="sm" onClick={() => setQuantity(quantity + 1)} disabled={isOutOfStock || quantity >= product.stock} className="fw-semibold">
                    +
                  </Button>
                </div>
              </Col>
              <Col>
                <div className="text-muted small">Subtotal</div>
                <div className="fw-bold">₹{(product.price * quantity).toFixed(2)}</div>
              </Col>
            </Row>
            </div>

            <div className="mt-4">
              <Button variant="primary" size="lg" className="w-100 mb-2 fw-semibold" onClick={handleBuyNow} disabled={isOutOfStock}>
                🛒 Buy Now - ₹{(product.price * quantity).toFixed(2)}
              </Button>
              <Button variant="outline-primary" size="lg" className="w-100 mb-2" onClick={handleAddToCart} disabled={isOutOfStock}>
                ➕ Add to Cart
              </Button>
              <Button variant="outline-secondary" size="lg" className="w-100" onClick={() => navigate('/products')}>
                ← Back to Products
              </Button>
            </div>

            <div className="mt-3">
              <small className="text-muted">
                For questions about this product, check the FAQ below or contact support.
              </small>
            </div>
          </Card>
        </Col>
      </Row>
      </div>
      {/* Tabs: Overview, Benefits, Ingredients, Body Systems, Dosage, Safety, FAQ */}
      <Row className="mt-5">
        <Col>
          <Card className="p-3 h-100 border rounded-3 bg-light">
            <Card.Body className="p-4">
              <Tabs defaultActiveKey="overview" id="product-details-tabs" className="mb-3">
                <Tab eventKey="overview" title="Overview">
                  <h4 className="fw-bold">{product.name}</h4>
                  {overviewText.map((t, idx) => (
                    <p className="text-muted" key={idx}>
                      {t}
                    </p>
                  ))}

                  <h6 className="fw-semibold mt-3">Highlights</h6>
                  <ListGroup horizontal className="flex-wrap">
                    {highlights.map((h, i) => (
                      <ListGroup.Item key={i} className="border-0 pe-3">
                        <Badge bg="info" className="me-2 badge-soft">
                          ✓
                        </Badge>
                        {h}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Tab>

                <Tab eventKey="benefits" title="Key Benefits">
                  <Row className="gy-3">
                    {benefitCards.map((b, i) => (
                      <Col md={6} lg={3} key={i}>
                        <Card className="p-3 h-100 border rounded-3 bg-light">
                          <Card.Body className="d-flex flex-column p-4">
                            <div className="fs-3 mb-2">{b.icon}</div>
                            <h6 className="fw-bold">{b.title}</h6>
                            <ul className="mt-2 mb-0 ps-3">
                              {b.body.map((line, idx) => (
                                <li key={idx} className="text-muted small">
                                  {line}
                                </li>
                              ))}
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Tab>

                <Tab eventKey="ingredients" title="Ingredients">
                  <p className="text-muted">
                    The formulation contains several proprietary blends; below are the main named blends and their
                    representative ingredients.
                  </p>

                  <Accordion defaultActiveKey="0">
                    {ingredientBlends.map((blend, i) => (
                      <Accordion.Item eventKey={String(i)} key={i}>
                        <Accordion.Header>{blend.title}</Accordion.Header>
                        <Accordion.Body>
                          <ListGroup variant="flush">
                            {blend.items.map((ing, idx) => (
                              <ListGroup.Item key={idx} className="ps-0">
                                {ing}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Tab>

                <Tab eventKey="systems" title="Body Systems">
                  <p className="text-muted mb-3">
                    This product support across multiple body systems:
                  </p>
                  <Row>
                    {bodySystems.map((s, i) => (
                      <Col md={4} lg={3} key={i} className="mb-2">
                        <Badge bg="info" className="me-2 badge-soft">
                          {i + 1}
                        </Badge>
                        <span className="text-muted">{s}</span>
                      </Col>
                    ))}
                  </Row>
                </Tab>

                <Tab eventKey="dosage" title="Dosage & Usage">
                  <h6 className="fw-bold">Dosage</h6>
                  <ListGroup className="mb-3">
                    {dosageNotes.map((d, i) => (
                      <ListGroup.Item key={i}>
                        <strong>{d.title}:</strong> <span className="ms-2">{d.text}</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  <h6 className="fw-bold">How to Use</h6>
                  <ol>
                    <li className="text-muted">Take the recommended quantity (see Dosage) daily.</li>
                    <li className="text-muted">Mix into water, juice, or take as directed.</li>
                    <li className="text-muted">Maintain hydration (min. 3 L water daily) and light exercise for best results.</li>
                    <li className="text-muted">Store in a cool, dry place away from direct sunlight.</li>
                  </ol>
                </Tab>

                <Tab eventKey="safety" title="Safety & Restrictions">
                  <BootstrapAlert variant="info">
                    <strong>Important:</strong> Not recommended for dialysis patients, pregnant or breastfeeding women,
                    or women during menstrual periods. Consult a healthcare professional if in doubt.
                  </BootstrapAlert>

                  <h6 className="mt-3">Notes</h6>
                  <p className="text-muted">
                    Ingredients are plant-origin/derived. The product has no side effects, but
                    individual responses may vary. If acidity increases initially, it may settle as body pH balances. If
                    necessary, take an antacid and consult your physician.
                  </p>
                </Tab>

                <Tab eventKey="faq" title="FAQ">
                  <Accordion>
                    {faqs.map((f, i) => (
                      <Accordion.Item eventKey={String(i)} key={i}>
                        <Accordion.Header>{f.q}</Accordion.Header>
                        <Accordion.Body className="text-muted">{f.a}</Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer CTA */}
      <Row className="mt-4">
        <Col>
          <Card className="p-3 h-100 border rounded-3 bg-light">
            <Row className="align-items-center">
              <Col md={8}>
                <h5 className="mb-1">Ready to purchase?</h5>
                <div className="text-muted">Choose quantity above and buy securely. Add to cart to continue shopping.</div>
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <Button variant="primary" onClick={handleBuyNow} disabled={isOutOfStock}>
                  🛒 Buy Now - ₹{(product.price * quantity).toFixed(2)}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetails;
