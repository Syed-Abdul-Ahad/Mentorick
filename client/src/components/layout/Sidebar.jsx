import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useIsAuthenticated } from '../../store/hooks';
import Button from '../shared/Button';
import { 
  AiOutlineHome, 
  AiOutlineUser, 
  AiOutlineSetting, 
  AiOutlineBarChart,
  AiOutlineTeam,
  AiOutlineCalendar,
  AiOutlineUsergroupAdd,
  AiOutlineTool,
} from 'react-icons/ai';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  const guestNavigation = [
    { name: 'Home', href: '/', icon: AiOutlineHome },
    { name: 'Mentors', href: '/mentors', icon: AiOutlineTeam },
  ];

  const getNavigation = () => {
    if (!isAuthenticated) {
      return guestNavigation;
    }

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
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <div className={`
        fixed left-0 top-0 h-full w-48 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 pb-4 flex flex-col flex-1">
            {isAuthenticated ? (
            <Link
              to="/profile/edit"
              onClick={closeMenu}
              className="flex items-center space-x-3 mb-8 rounded-lg p-1 -m-1 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {user?.profile?.headshot ? (
                  <img
                    src={user.profile.headshot}
                    loading="lazy"
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <AiOutlineUser className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">Profile</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="flex items-center space-x-3 mb-8 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <AiOutlineUser className="h-5 w-5" />
              <span>Sign in</span>
            </Link>
          )}

          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMenu}
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

          {!isAuthenticated && (
            <div className="mt-auto border-t border-gray-200 bg-gray-50 px-3 py-4 space-y-2.5">
              <Button
                variant="solid"
                size="md"
                className="w-full font-semibold shadow-sm"
                onClick={() => {
                  closeMenu();
                  navigate('/login');
                }}
              >
                Book a Mentor
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full font-semibold border-2 bg-white shadow-sm"
                onClick={() => {
                  closeMenu();
                  navigate('/mentor-signup');
                }}
              >
                Become a Mentor
              </Button>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/10 backdrop-blur-[3px]"
          onClick={closeMenu}
        />
      )}
    </>
  );
};

export default Sidebar;
