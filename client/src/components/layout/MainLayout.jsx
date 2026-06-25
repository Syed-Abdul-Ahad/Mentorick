import { useState } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';
import Sidebar from './Sidebar';
import { MobileMenuProvider } from '../../context/MobileMenuContext';

const MainLayout = ({ children, hideMobileHeader = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);

  const menuContext = {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toggleMobileMenu,
  };

  return (
    <MobileMenuProvider value={menuContext}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {!hideMobileHeader && (
          <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between h-14 px-4">
              <span className="font-bold text-lg text-primary-600">Mentorick</span>
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                aria-label="Toggle menu"
              >
                <AiOutlineMenu className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        <div className="lg:ml-48">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    </MobileMenuProvider>
  );
};

export default MainLayout;
