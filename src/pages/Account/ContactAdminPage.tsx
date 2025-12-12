import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Alert } from '../../components/UI';
import { useAuthStore } from '../../store/useAuthStore';
import { MessageSquare, Send } from 'lucide-react';
import { ticketApi } from '../../api/ticket';
import { ApiError } from '../../api/client';

const ContactAdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phoneNumber: user.phone || '',
        subject: '',
        message: '',
      });
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validate required fields
    if (!formData.subject.trim()) {
      setErrorMessage('Please enter a subject');
      setIsSubmitting(false);
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage('Please enter a message');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the contact admin API endpoint
      await ticketApi.contactAdmin({
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setSuccessMessage('Your message has been sent successfully! We will get back to you soon.');
      setFormData((prev) => ({
        ...prev,
        subject: '',
        message: '',
      }));
    } catch (error) {
      // Handle API errors
      if (error instanceof ApiError) {
        const errorMessage = error.message || 'Failed to send message. Please try again later.';
        setErrorMessage(errorMessage);
      } else {
        setErrorMessage('Failed to send message. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-muted-foreground space-x-2">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/account" className="hover:text-foreground">My Account</Link>
            <span>/</span>
            <span className="text-foreground">Contact Admin</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-semibold text-foreground">Contact Admin</h1>
          </div>
          <p className="text-muted-foreground">
            Have a question or need assistance? Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <Alert variant="success">
                  {successMessage}
                </Alert>
              )}

              {/* Error Message */}
              {errorMessage && (
                <Alert variant="destructive">
                  {errorMessage}
                </Alert>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                  disabled
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                  disabled
                />
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject <span className="text-destructive">*</span>
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter the subject of your message"
                  className="w-full"
                  required
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your message here..."
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactAdminPage;

