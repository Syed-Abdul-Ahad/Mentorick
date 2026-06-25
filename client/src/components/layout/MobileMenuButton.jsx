import { AiOutlineMenu } from 'react-icons/ai';
import { useMobileMenu } from '../../context/MobileMenuContext';

const MobileMenuButton = ({ className = '' }) => {
  const { toggleMobileMenu } = useMobileMenu();

  return (
    <button
      type="button"
      onClick={toggleMobileMenu}
      className={`p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors ${className}`}
      aria-label="Toggle menu"
    >
      <AiOutlineMenu className="h-6 w-6" />
    </button>
  );
};

export default MobileMenuButton;
