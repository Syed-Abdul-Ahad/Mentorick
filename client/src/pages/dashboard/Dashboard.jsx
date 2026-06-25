import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../store/hooks';
import { clearUser } from '../../store/slices/authSlice';
import { authService } from '../../api';
import apiClient from '../../api/axiosConfig';
import MainLayout from '../../components/layout/MainLayout';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const user = useUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentTab = searchParams.get('tab') || 'overview';
  
  const [mentorProfile, setMentorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user?.role === 'mentor' && currentTab === 'payments') {
      const fetchProfile = async () => {
        setLoadingProfile(true);
        try {
          const res = await apiClient.get('/mentor/my-profile');
          if (res.data && res.data.data) {
            setMentorProfile(res.data.data);
          }
        } catch (error) {
          console.error("Error fetching mentor profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [user, currentTab]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      dispatch(clearUser());
      navigate('/login');
    }
  };

  const handleConnectPayPal = async () => {
    try {
      const res = await apiClient.get('/payments/connect');
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error("Error connecting PayPal:", error);
      toast.error('Failed to initiate PayPal connection');
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        {user?.role === 'mentor' && (
          <div className="flex border-b border-gray-200 mb-8 space-x-6">
            <button
              onClick={() => setSearchParams({ tab: 'overview' })}
              className={`pb-3 font-semibold text-lg transition-colors ${currentTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'payments' })}
              className={`pb-3 font-semibold text-lg transition-colors ${currentTab === 'payments' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              💳 Payment Settings
            </button>
          </div>
        )}

        {/* Content based on tab */}
        {currentTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
            <div className="max-w-4xl">
              <h2 className="text-3xl font-bold mb-4">
                Welcome back, {user?.firstName || user?.name || 'User'}! 👋
              </h2>
              <p className="text-xl text-primary-100 mb-6">
                {user?.role === 'mentor' 
                  ? 'Ready to inspire and guide your mentees today?'
                  : 'Continue your learning journey with amazing mentors!'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user?.role === 'mentor' ? (
                  <>
                    <button
                      onClick={() => navigate('/sessions')}
                      className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-200"
                    >
                      ⚙️ Manage Session Settings
                    </button>
                    <button
                      onClick={() => navigate('/my-bookings')}
                      className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-all duration-200 border border-primary-400"
                    >
                      📅 View My Bookings
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/mentors')}
                      className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-200"
                    >
                      🔍 Find Mentors
                    </button>
                    <button
                      onClick={() => navigate('/my-bookings')}
                      className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-all duration-200 border border-primary-400"
                    >
                      📅 My Sessions
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-2xl">
                  📊
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.role === 'mentor' ? '47' : '12'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 text-2xl">
                  ⭐
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.9</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 text-2xl">
                  🕒
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hours Mentored</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.role === 'mentor' ? '94' : '24'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600 text-2xl">
                  🎯
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {user?.role === 'mentor' ? 'Active Mentees' : 'Goals Achieved'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.role === 'mentor' ? '23' : '8'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: '✅',
                    title: 'Session completed with Sarah Johnson',
                    time: '2 hours ago',
                    color: 'green'
                  },
                  {
                    icon: '📅',
                    title: 'New booking request received',
                    time: '5 hours ago',
                    color: 'blue'
                  },
                  {
                    icon: '⭐',
                    title: 'Received 5-star review',
                    time: '1 day ago',
                    color: 'yellow'
                  },
                  {
                    icon: '💬',
                    title: 'New message from Alex Wilson',
                    time: '2 days ago',
                    color: 'purple'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl mr-3">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Upcoming Sessions</h3>
              <div className="space-y-4">
                {[
                  {
                    name: 'Emma Davis',
                    time: 'Today, 2:00 PM',
                    duration: '60 min',
                    topic: 'Career Development'
                  },
                  {
                    name: 'Michael Chen',
                    time: 'Tomorrow, 10:00 AM',
                    duration: '90 min',
                    topic: 'Technical Interview Prep'
                  },
                  {
                    name: 'Lisa Rodriguez',
                    time: 'Dec 28, 3:30 PM',
                    duration: '30 min',
                    topic: 'Resume Review'
                  }
                ].map((session, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{session.name}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        {session.duration}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{session.time}</p>
                    <p className="text-sm text-gray-500">{session.topic}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors duration-200"
              >
                View all sessions →
              </button>
            </div>
          </div>
        </div>
        )}

        {currentTab === 'payments' && user?.role === 'mentor' && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Payment Settings</h2>
            
            {loadingProfile ? (
              <p className="text-gray-500">Loading your profile...</p>
            ) : mentorProfile?.paypal?.isConnected ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-green-600 text-3xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-green-800">PayPal Connected</h3>
                    <p className="text-green-700">You are ready to receive payments.</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200 text-green-800">
                  <p><strong>Email:</strong> {mentorProfile.paypal.email}</p>
                  <p><strong>Merchant ID:</strong> {mentorProfile.paypal.merchantId}</p>
                  <p><strong>Connected on:</strong> {new Date(mentorProfile.paypal.connectedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-red-600 text-3xl">⚠️</div>
                    <div>
                      <h3 className="text-lg font-bold text-red-800">PayPal Not Connected</h3>
                      <p className="text-red-700">You have not connected your PayPal account. You cannot receive payments for your sessions.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectPayPal}
                  className="bg-[#0070ba] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#003087] transition-all duration-200 flex items-center space-x-2"
                >
                  <span>💳</span>
                  <span>Connect PayPal</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Dashboard;
