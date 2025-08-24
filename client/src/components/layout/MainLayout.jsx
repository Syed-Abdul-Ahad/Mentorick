import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { AiOutlineMenu } from 'react-icons/ai';

const MainLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />
      
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <AiOutlineMenu className="h-6 w-6 text-gray-600" />
        </button>
      </div>
      
      {/* Main content area */}
      <div className="lg:ml-48">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
