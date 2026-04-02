import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Alert } from '../../components/UI';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationContext } from '../../providers/NotificationProvider';
import { Mail, ArrowLeft } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { pendingVerification, verifyEmail, resendOtp, isLoading } = useAuthStore();
  const { showNotification } = useNotificationContext();
  
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [showCheckoutSetupBanner, setShowCheckoutSetupBanner] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no pending verification
  useEffect(() => {
    if (!pendingVerification) {
      navigate('/auth/register');
    }
  }, [pendingVerification, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Show explicit guidance when redirected here from guest checkout post-payment.
  useEffect(() => {
    const fromCheckout = sessionStorage.getItem('checkout_verify_email_after_payment');
    if (!fromCheckout) return;

    setShowCheckoutSetupBanner(true);
    showNotification('Complete account setup: enter your email verification code.', 'info', 5000);
    sessionStorage.removeItem('checkout_verify_email_after_payment');
  }, [showNotification]);

  if (!pendingVerification) {
    return null;
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error when user types

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 5; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    setError('');
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 4 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpString = otp.join('');
    if (otpString.length !== 5) {
      setError('Please enter the complete 5-digit code');
      return;
    }

    try {
      await verifyEmail(otpString);
      // Show success message first
      setVerificationSuccess(true);
      setError('');
      
      // Redirect to login after showing success message
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendOtp();
      setSuccessMessage('Verification code sent successfully!');
      setResendCooldown(60); // 60 second cooldown
      setError('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="border border-[#C8E6C8] rounded-lg p-8 bg-[#F8FEF8] shadow-sm">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Mail className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
        <p className="text-gray-600">
          Enter the 5-digit code we sent to{' '}
          <span className="font-medium">{pendingVerification.identifier}</span>
        </p>
      </div>

      {verificationSuccess && (
        <Alert variant="default" className="mb-6 border-green-200 bg-green-50 text-green-800">
          Email verified successfully! You can now sign in to your account.
        </Alert>
      )}

      {showCheckoutSetupBanner && !verificationSuccess && (
        <Alert variant="default" className="mb-6 border-blue-200 bg-blue-50 text-blue-900">
          Your order was successful. Complete your account setup by entering the verification code sent to your email.
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      {successMessage && !verificationSuccess && (
        <Alert variant="default" className="mb-6 border-green-200 bg-green-50 text-green-800">
          {successMessage}
        </Alert>
      )}

      {!verificationSuccess && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Verification Code
            </label>
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || otp.join('').length !== 5}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
      )}

      {!verificationSuccess && (
        <div className="mt-6 text-center space-y-4">
          <div>
            <span className="text-sm text-gray-600">Didn't receive the code? </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isLoading}
              className="text-sm font-medium text-green-800 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : 'Resend code'
              }
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link 
              to="/auth/register" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to registration
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmailPage;