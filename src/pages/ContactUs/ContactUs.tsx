import React, { useState, useCallback } from 'react';
import Alert from '../../components/Alert/Alert';
import { contactService } from '../../api/contactService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/UI/card';
import { Input } from '../../components/UI/input';
import { Textarea } from '../../components/UI/textarea';
import { Button } from '../../components/UI/button';
import { toast } from 'sonner';
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
        await contactService.sendQuery({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        });

        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
        toast.success('Message sent successfully! We will get back to you soon.');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again later.';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm]
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-text-primary">Contact Us</h1>
          <p className="text-text-secondary text-base">
            Have a question, concern, or feedback? We'd love to hear from you!
          </p>
        </div>

        {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>We usually respond within one business day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">
                    Name <span className="text-danger">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">
                    Email <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Subject <span className="text-danger">*</span>
                </label>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What is this regarding?"
                  aria-invalid={!!errors.subject}
                />
                {errors.subject && <p className="text-xs text-danger">{errors.subject}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Message <span className="text-danger">*</span>
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please provide details about your inquiry, grievance, or feedback..."
                  aria-invalid={!!errors.message}
                  className="min-h-[160px]"
                />
                {errors.message && <p className="text-xs text-danger">{errors.message}</p>}
                <p className="text-xs text-text-secondary">Minimum 10 characters required.</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Other Ways to Reach Us</CardTitle>
            <CardDescription>We’re available on multiple channels.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="contact-info-item text-center">
                <div className="contact-icon mb-2">📧</div>
                <strong>Email</strong>
                <p className="text-text-secondary mb-0 text-sm">support@divaksha.com</p>
              </div>
              <div className="contact-info-item text-center">
                <div className="contact-icon mb-2">📞</div>
                <strong>Phone</strong>
                <p className="text-text-secondary mb-0 text-sm">+91 123 456 7890</p>
              </div>
              <div className="contact-info-item text-center">
                <div className="contact-icon mb-2">🕒</div>
                <strong>Business Hours</strong>
                <p className="text-text-secondary mb-0 text-sm">Mon - Sat: 9 AM - 6 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs;

