import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../store/slices/authSlice";
import { authService } from "../../api";
import Button from "../../components/shared/Button";
import FormInput from "../../components/shared/FormInput";
import AuthFormLayout from "../../components/shared/AuthFormLayout";
import AuthRightSection from "../../components/shared/AuthRightSection";

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
      alert("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    const isPasswordValid = validatePassword(formData.password);
    if (!isPasswordValid) {
      setPasswordValid(false);
      return;
    }

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
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
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
          <FormInput
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password"
            label="Password"
            required
            error={!passwordValid && formData.password ? "Password does not meet requirements" : null}
            success={passwordValid && formData.password ? "✓ Password meets all requirements" : null}
            helpText={!formData.password ? "Must be at least 6 characters with 1 uppercase letter and 1 number" : null}
          />

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
