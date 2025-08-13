import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../store/slices/authSlice';
import { authService } from '../../api';
import Button from '../../components/shared/Button';
import FormInput from '../../components/shared/FormInput';
import AuthFormLayout from '../../components/shared/AuthFormLayout';
import AuthRightSection from '../../components/shared/AuthRightSection';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Toast from '../../components/shared/Toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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

    const loadingToast = toast.loading('Signing in...');

    try {
      const response = await authService.login(formData);
      console.log('Login response:', response);
      dispatch(setUser(response));
      toast.success('Welcome back!', { id: loadingToast });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed', { id: loadingToast });
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toast />
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
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <HiOutlineEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <HiOutlineEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <a href="#" className="text-primary-500 hover:text-primary-600 font-medium">
                Forgot your password?
              </a>
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
