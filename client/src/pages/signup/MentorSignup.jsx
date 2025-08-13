import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../store/slices/authSlice";
import { authService } from "../../api";
import Button from "../../components/shared/Button";
import FormInput from "../../components/shared/FormInput";
import AuthFormLayout from "../../components/shared/AuthFormLayout";
import AuthRightSection from "../../components/shared/AuthRightSection";
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Toast from '../../components/shared/Toast';

const MentorSignup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    experience: "",
    expertise: "",
    linkedIn: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasMinLength && hasUpperCase && hasNumber;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate password on change
    if (name === "password") {
      const isValid = validatePassword(value);
      setPasswordValid(isValid || value === ""); // Don't show error for empty password
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    const isPasswordValid = validatePassword(formData.password);
    if (!isPasswordValid) {
      setPasswordValid(false);
      toast.error("Password must be at least 6 characters with one uppercase letter and one number");
      return;
    }

    const loadingToast = toast.loading('Creating your mentor account...');
    setLoading(true);
    setError(null);

    // Prepare mentor data for registration
    const userData = {
      email: formData.email,
      password: formData.password,
      role: "mentor", // Set role to mentor
      firstName: formData.firstName,
      lastName: formData.lastName,
    };

    try {
      const response = await authService.register(userData);
      dispatch(setUser(response.user));
      toast.success('Mentor account created successfully! Welcome!', { id: loadingToast });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed', { id: loadingToast });
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toast />
      <AuthFormLayout
        title="Become a Mentor"
        subtitle="Share your expertise and guide the next generation"
        error={error}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First"
              label="First name"
              required
            />
            <FormInput
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last"
              label="Last name"
              required
            />
          </div>

          {/* Email Field */}
          <FormInput
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="name@company.com"
            label="Email"
            required
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
                placeholder="Create a password"
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  !passwordValid && formData.password
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-primary-500"
                }`}
                required
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
            {!passwordValid && formData.password && (
              <p className="text-sm text-red-600 mt-1">
                Password does not meet requirements
              </p>
            )}
            {passwordValid && formData.password && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Password meets all requirements
              </p>
            )}
            {!formData.password && (
              <p className="text-sm text-gray-500 mt-1">
                Must be at least 6 characters with 1 uppercase letter and 1 number
              </p>
            )}
          </div>

          {/* Terms and Privacy Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label
              htmlFor="agreeToTerms"
              className="ml-2 text-sm text-gray-600"
            >
              I agree to the{" "}
              <a
                href="#"
                className="text-primary-500 hover:text-primary-600 underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-primary-500 hover:text-primary-600 underline"
              >
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full"
            disabled={
              !agreeToTerms ||
              loading ||
              (!passwordValid && formData.password)
            }
          >
            {loading ? "Creating Mentor Account..." : "Join as Mentor"}
          </Button>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-gray-600">Already have an account? </span>
            <a
              href="/login"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Log in
            </a>
          </div>
        </form>
      </AuthFormLayout>

      {/* Right side - Mentor Benefits Section */}
      <AuthRightSection 
        heading="Empower Others"
        subheading="Make a lasting impact by sharing your knowledge and experience with aspiring professionals."
      />
    </div>
  );
};

export default MentorSignup;
