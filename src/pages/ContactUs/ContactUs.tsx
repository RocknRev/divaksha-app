import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert as BootstrapAlert } from 'react-bootstrap';
import Alert from '../../components/Alert/Alert';
import './ContactUs.css';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error for this field when user starts typing
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Simulate API call - in production, this would call your backend
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Log form data to console as requested
        console.log('Contact Form Submission:', {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          timestamp: new Date().toISOString(),
        });

        // Show success message
        setShowSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});

        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } catch (err) {
        setError('Failed to send message. Please try again later.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm]
  );

  return (
    <Container className="contact-us-container py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold mb-3">Contact Us</h1>
            <p className="lead text-muted">
              Have a question, concern, or feedback? We'd love to hear from you!
            </p>
          </div>

          {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

          {showSuccess && (
            <BootstrapAlert variant="success" dismissible onClose={() => setShowSuccess(false)}>
              <BootstrapAlert.Heading>Message Sent Successfully!</BootstrapAlert.Heading>
              <p className="mb-0">Thank you for contacting us. We'll get back to you as soon as possible.</p>
            </BootstrapAlert>
          )}

          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        isInvalid={!!errors.name}
                        size="lg"
                      />
                      <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Email <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        isInvalid={!!errors.email}
                        size="lg"
                      />
                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Subject <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What is this regarding?"
                    isInvalid={!!errors.subject}
                    size="lg"
                  />
                  <Form.Control.Feedback type="invalid">{errors.subject}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Message <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please provide details about your inquiry, grievance, or feedback..."
                    isInvalid={!!errors.message}
                    style={{ resize: 'vertical' }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.message}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Minimum 10 characters required. Please provide as much detail as possible.
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="fw-semibold py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mt-4 shadow-sm border-0">
            <Card.Body>
              <h5 className="fw-bold mb-3">Other Ways to Reach Us</h5>
              <Row>
                <Col md={4} className="mb-3">
                  <div className="contact-info-item">
                    <div className="contact-icon mb-2">📧</div>
                    <strong>Email</strong>
                    <p className="text-muted mb-0 small">support@divaksha.com</p>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="contact-info-item">
                    <div className="contact-icon mb-2">📞</div>
                    <strong>Phone</strong>
                    <p className="text-muted mb-0 small">+91 123 456 7890</p>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="contact-info-item">
                    <div className="contact-icon mb-2">🕒</div>
                    <strong>Business Hours</strong>
                    <p className="text-muted mb-0 small">Mon - Sat: 9 AM - 6 PM</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ContactUs;

