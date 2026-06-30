import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setUser } from '../../store/slices/authSlice';
import { authService } from '../../api';
import Button from '../../components/shared/Button';
import FormInput from '../../components/shared/FormInput';
import AuthFormLayout from '../../components/shared/AuthFormLayout';
import AuthRightSection from '../../components/shared/AuthRightSection';
import ForgotPasswordModal from '../../components/shared/ForgotPasswordModal';
import Seo from '../../components/seo/Seo';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(formData);
      dispatch(setUser(response));
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    setForgotPasswordLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || 'Password reset link sent to your email');
      setIsForgotPasswordOpen(false);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Seo
        title="Sign In | Mentorick"
        description="Sign in to Mentorick to book mentors, manage sessions, and access your dashboard."
        canonical="/login"
        noindex
      />
      <AuthFormLayout
        title="Sign in to your account"
        subtitle="Log in to connect, learn, and grow with your mentor."
        error={error}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <FormInput
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            label="Email address"
            required
            autoComplete="email"
          />

          {/* Password Field */}
          <FormInput
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            label="Password"
            required
            autoComplete="current-password"
          />

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Signup Link */}
          <div className="text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <a
              href="/signup"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Sign up
            </a>
          </div>
        </form>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSubmit={handleForgotPassword}
          loading={forgotPasswordLoading}
        />
      </AuthFormLayout>

      {/* Right side - Welcome Back Section */}
      <AuthRightSection 
        heading="Welcome Back"
        subheading="Continue your growth journey with support from expert mentors today."
      />
    </div>
  );
};

export default Login;
