import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AiOutlineHome, 
  AiOutlineUser, 
  AiOutlineSetting, 
  AiOutlineBarChart,
  AiOutlineMenu,
  AiOutlineClose
} from 'react-icons/ai';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Profile', href: '/profile', icon: AiOutlineUser },
    { name: 'Home', href: '/', icon: AiOutlineHome },
    { name: 'Session Settings', href: '/sessions', icon: AiOutlineSetting },
    { name: 'Dashboard', href: '/dashboard', icon: AiOutlineBarChart },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? (
            <AiOutlineClose className="h-6 w-6" />
          ) : (
            <AiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-48 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <AiOutlineUser className="h-6 w-6 text-gray-600" />
            </div>
            <div className="text-sm text-gray-600">Profile</div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
