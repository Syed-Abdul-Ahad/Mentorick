import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { setUser } from '../../store/slices/authSlice';
import { authService } from '../../api';
import Button from '../../components/shared/Button';
import FormInput from '../../components/shared/FormInput';
import AuthFormLayout from '../../components/shared/AuthFormLayout';
import AuthRightSection from '../../components/shared/AuthRightSection';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validatePasswords = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, formData.password);
      
      // Backend auto-logs in the user, so update Redux state
      if (response.data && response.data.user) {
        dispatch(setUser({ user: response.data.user }));
        toast.success('Password reset successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after successful reset and auto-login
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        toast.success(response.message || 'Password reset successful! You can now login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'Failed to reset password. The link may be invalid or expired.');
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthFormLayout
        title="Reset Your Password"
        subtitle="Enter your new password below to regain access to your account."
        error={error}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <FormInput
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter new password"
            label="New Password"
            required
            autoComplete="new-password"
          />

          {/* Confirm Password Field */}
          <FormInput
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm new password"
            label="Confirm Password"
            required
            autoComplete="new-password"
          />

          {/* Password Requirements Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>At least 6 characters long</li>
              <li>Contains at least one uppercase letter</li>
              <li>Contains at least one lowercase letter</li>
              <li>Contains at least one number</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <span className="text-gray-600">Remember your password? </span>
            <a
              href="/login"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Back to Login
            </a>
          </div>
        </form>
      </AuthFormLayout>

      {/* Right side - Security Section */}
      <AuthRightSection 
        heading="Secure Your Account"
        subheading="Create a strong password to protect your account and continue your mentoring journey safely."
      />
    </div>
  );
};

export default ResetPassword;
