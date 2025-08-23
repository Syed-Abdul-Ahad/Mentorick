import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLinkedin, FaTwitter, FaInstagram} from 'react-icons/fa';
import { CiGlobe } from "react-icons/ci";
import { HiOutlineUsers, HiOutlineStar, HiOutlineTrendingUp, HiOutlineBriefcase, HiOutlineClock, HiOutlineHeart, HiOutlineUser } from 'react-icons/hi';
import { BiHappyBeaming } from "react-icons/bi";
import apiClient from '../../api/axiosConfig';
import currencyService from '../../api/currencyService';
import { useUser } from '../../store/hooks';
import BookingCalendar from '../../components/booking/BookingCalendar';
import Toast from '../../components/shared/Toast';


const MentorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [convertedSessions, setConvertedSessions] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get(`/mentor/profile/${id}`);
        const profileData = res.data.data;
        setProfile(profileData);

        // Convert session prices to real-time rates if needed
        if (profileData.sessionDurations && profileData.sessionDurations.length > 0) {
          setPricesLoading(true);
          const converted = await Promise.all(
            profileData.sessionDurations.map(async (session) => {
              try {
                // Ensure both USD and PKR are up-to-date with real-time rates
                let usdPrice = session.priceUSD;
                let pkrPrice = session.pricePKR;

                // If one currency is missing or 0, convert from the other
                if (!usdPrice || usdPrice === 0) {
                  if (pkrPrice && pkrPrice > 0) {
                    usdPrice = await currencyService.convertCurrency(pkrPrice, 'PKR', 'USD');
                  }
                } else if (!pkrPrice || pkrPrice === 0) {
                  if (usdPrice && usdPrice > 0) {
                    pkrPrice = await currencyService.convertCurrency(usdPrice, 'USD', 'PKR');
                  }
                }

                return {
                  ...session,
                  priceUSD: usdPrice,
                  pricePKR: pkrPrice,
                  formattedUSD: currencyService.formatCurrency(usdPrice, 'USD'),
                  formattedPKR: currencyService.formatCurrency(pkrPrice, 'PKR')
                };
              } catch (error) {
                console.error('Error converting session prices:', error);
                return {
                  ...session,
                  formattedUSD: currencyService.formatCurrency(session.priceUSD || 50, 'USD'),
                  formattedPKR: currencyService.formatCurrency(session.pricePKR || 14000, 'PKR')
                };
              }
            })
          );
          setConvertedSessions(converted);
          setPricesLoading(false);
        }
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleBookSession = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    if (user.role === 'mentor') {
      showToast('You cannot book a session with yourself', 'error');
      return;
    }

    setShowBookingModal(true);
  };

  const handleBookingSuccess = (booking) => {
    setShowBookingModal(false);
    showToast('Session booked successfully! Check your dashboard for details.');
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">😔</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Mentor Not Found</h2>
          <p className="text-gray-500">The mentor profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const socialIcons = {
    linkedin: FaLinkedin,
    twitter: FaTwitter,
    instagram: FaInstagram
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">Mentorick</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Book Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  <img 
                    src={profile.headshot || '/api/placeholder/120/120'} 
                    alt={profile.fullName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100"
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {profile.fullName}
                  </h1>
                  <p className="text-lg text-primary font-medium mb-3">
                    {profile.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <HiOutlineUsers className="mr-2" />
                      <span>500+ Mentees</span>
                    </div>
                    <div className="flex items-center">
                      <HiOutlineStar className="mr-2 text-gray-600" />
                      <span>4.9 Rating</span>
                    </div>
                    <div className="flex items-center">
                      <CiGlobe className="mr-2 text-gray-600" />
                      <span>{profile.languages?.length || 0} Languages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {profile.socialLinks && Object.keys(profile.socialLinks).some(key => profile.socialLinks[key]) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Connect:</span>
                    <div className="flex space-x-3">
                      {Object.entries(profile.socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        const IconComponent = socialIcons[platform];
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-primary transition-colors p-2 hover:bg-gray-50 rounded-lg"
                          >
                            <IconComponent className="w-5 h-5" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <HiOutlineUser className="mr-2 text-primary" />
                About
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {profile.about}
              </p>
              {profile.idealMentee && (
                <div className="mt-4 p-4 bg-primary-200/20 rounded-lg">
                  <h3 className="font-medium text-gray-600 mb-2">Best suited for:</h3>
                  <p className="text-primary-500">{profile.idealMentee}</p>
                </div>
              )}
            </div>

            {/* Topics Section */}
            {profile.topics && profile.topics.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineBriefcase className="mr-2 text-primary" />
                  Expertise Areas
                </h2>
                <div className="flex flex-wrap gap-3">
                  {profile.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary-200/20 text-primary rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Section */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CiGlobe className="mr-2 text-primary" />
                  Languages
                </h2>
                <div className="flex flex-wrap gap-3">
                  {profile.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary-200/20 text-primary rounded-full text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fun Fact */}
            {profile.funFact && (
              <div className="bg-white rounded-xl shadow-sm p-8 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BiHappyBeaming className="mr-2 text-primary" />
                  Fun Fact
                </h2>
                <p className="text-gray-700 italic">"{profile.funFact}"</p>
              </div>
            )}
          </div>

          {/* Right Column - Stats and Session Info */}
          <div className="lg:col-span-1">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="flex justify-center mb-3">
                  <HiOutlineUsers className="text-2xl text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">500+</div>
                <div className="text-sm text-gray-600">Mentees</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="flex justify-center mb-3">
                  <HiOutlineStar className="text-2xl text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">4.9</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="flex justify-center mb-3">
                  <CiGlobe className="text-2xl text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{profile.languages?.length || 0}</div>
                <div className="text-sm text-gray-600">Languages</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="flex justify-center mb-3">
                  <HiOutlineTrendingUp className="text-2xl text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary mb-1">98%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>

            {/* Session Details */}
            {(convertedSessions.length > 0 || (profile.sessionDurations && profile.sessionDurations.length > 0)) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiOutlineClock className="mr-2 text-primary" />
                  Session Options
                </h3>
                {pricesLoading ? (
                  <div className="space-y-3">
                    {profile.sessionDurations.map((session, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{session.duration}</span>
                        <div className="text-right">
                          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-12 h-3 bg-gray-200 rounded mt-1 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 text-center">
                      ⏳ Updating prices with real-time exchange rates...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {convertedSessions.map((session, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{session.duration}</span>
                        <div className="text-right">
                          <div className="font-semibold text-primary">{session.formattedUSD}</div>
                          <div className="text-xs text-gray-500">{session.formattedPKR}</div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      ✅ Prices updated with real-time exchange rates
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Donation Info */}
            {profile.donationInfo && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <HiOutlineHeart className="mr-2 text-primary" />
                  For the Greater Good
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{profile.donationInfo}</p>
              </div>
            )}

            {/* Book Session CTA */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <button 
                onClick={handleBookSession}
                className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors mb-3"
              >
                Book a Session
              </button>
              <p className="text-xs text-gray-500 text-center">
                {user ? 'Choose your preferred time slot' : 'Login required to book sessions'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Book Session with {profile?.fullName}
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-0">
              <BookingCalendar
                mentorId={id}
                mentorName={profile?.fullName}
                onBookingSuccess={handleBookingSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default MentorPublicProfile;
