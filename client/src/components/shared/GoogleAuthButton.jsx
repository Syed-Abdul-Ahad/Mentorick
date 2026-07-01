import Button from './Button';
import { FcGoogle } from 'react-icons/fc';

const getGoogleLoginUrl = (role = 'mentee') => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return `${baseUrl}/auth/google/login?role=${role}`;
};

const GoogleAuthButton = ({ role = 'mentee', label = 'Continue with Google' }) => {
  const handleClick = () => {
    window.location.href = getGoogleLoginUrl(role);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full !border-gray-300 !text-gray-700 hover:!bg-gray-50"
      onClick={handleClick}
    >
      <span className="flex items-center justify-center gap-3">
        <FcGoogle className="h-5 w-5" />
        <span>{label}</span>
      </span>
    </Button>
  );
};

export default GoogleAuthButton;
