import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../store/hooks';
import { 
  AiOutlineHome, 
  AiOutlineUser, 
  AiOutlineSetting, 
  AiOutlineBarChart,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineTeam,
  AiOutlineCalendar,
  AiOutlineClockCircle,
  AiOutlineUsergroupAdd,
  AiOutlineTool,
} from 'react-icons/ai';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const user = useUser();

  // Different navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'Profile', href: '/profile/edit', icon: AiOutlineUser },
      { name: 'Home', href: '/', icon: AiOutlineHome },
      { name: 'Mentors', href: '/mentors', icon: AiOutlineTeam },
      { name: 'Mega Sessions', href: '/mega-sessions', icon: AiOutlineUsergroupAdd },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseNavigation,
        { name: 'Admin: Mega Sessions', href: '/admin/mega-sessions', icon: AiOutlineTool },
        { name: 'Dashboard', href: '/dashboard', icon: AiOutlineBarChart },
      ];
    } else if (user?.role === 'mentor') {
      return [
        ...baseNavigation,
        { name: 'Availability Settings', href: '/sessions', icon: AiOutlineSetting },
        { name: 'My Bookings', href: '/my-bookings', icon: AiOutlineCalendar },
        { name: 'Dashboard', href: '/dashboard', icon: AiOutlineBarChart },
      ];
    } else {
      return [
        ...baseNavigation,
        { name: 'My Bookings', href: '/my-bookings', icon: AiOutlineCalendar },
        { name: 'Dashboard', href: '/dashboard', icon: AiOutlineBarChart },
      ];
    }
  };

  const navigation = getNavigation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
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
              {user?.profile?.headshot ? (
              <img src={user?.profile?.headshot} alt="profile picture" className='object-cover w-[100%] h-[100%] rounded-full'/>
              ) : (
                <AiOutlineUser className="h-4 w-4 text-gray-400" />
              )}
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
                      ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
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
