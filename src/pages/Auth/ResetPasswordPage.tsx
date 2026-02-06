import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Alert } from '../../components/UI';
import { authApi } from '../../api/auth';
import { Eye, EyeOff } from 'lucide-react';

export interface ResetPasswordLocationState {
  identifier?: string;
  verificationId?: string;
  message?: string;
}

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ResetPasswordLocationState;

  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const identifier = state.identifier ?? '';
  const verificationId = state.verificationId ?? '';

  useEffect(() => {
    if (!identifier || !verificationId) {
      setError('Missing reset session. Please request a new OTP from the login page.');
    } else {
      setError('');
    }
  }, [identifier, verificationId]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const num = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = num;
    setOtp(newOtp);
    setError('');
    if (num && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length && i < 5; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    setError('');
    const nextEmpty = newOtp.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? 4 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !verificationId) {
      setError('Missing reset session. Please request a new OTP from the login page.');
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 5) {
      setError('Please enter the complete 5-digit code from your email.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        otp: otpString,
        identifier,
        verificationId,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login', { state: { resetSuccess: true } });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!identifier || !verificationId) {
    return (
      <div className="border border-[#C8E6C8] rounded-lg p-8 bg-[#F8FEF8] shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-2 text-sm text-gray-600">
            You need a valid reset session to set a new password.
          </p>
        </div>
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
        <Link
          to="/auth/login"
          className="inline-flex justify-center w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="border border-[#C8E6C8] rounded-lg p-8 bg-[#F8FEF8] shadow-sm">
        <Alert variant="success" className="mb-6">
          Your password has been reset. Redirecting you to sign in...
        </Alert>
      </div>
    );
  }

  return (
    <div className="border border-[#C8E6C8] rounded-lg p-8 bg-[#F8FEF8] shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the 5-digit code we sent to <span className="font-medium">{identifier}</span> and
          choose a new password.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Verification code
          </label>
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E4700] focus:border-[#1E4700]"
                autoComplete="one-time-code"
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
            New password
          </label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pr-10 !border-gray-400"
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm new password
          </label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full pr-10 !border-gray-400"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/auth/login')}
            disabled={isLoading}
          >
            Back to sign in
          </Button>
          <Button type="submit" className="flex-1 !text-[#1E4700]" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset password'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
