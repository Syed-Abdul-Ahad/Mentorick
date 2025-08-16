import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      
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
