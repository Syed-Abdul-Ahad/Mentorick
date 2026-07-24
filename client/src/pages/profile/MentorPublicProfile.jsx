import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLinkedin, FaTwitter, FaInstagram} from 'react-icons/fa';
import { CiGlobe } from "react-icons/ci";
import { HiOutlineUsers, HiOutlineStar, HiOutlineTrendingUp, HiOutlineBriefcase, HiOutlineClock, HiOutlineHeart, HiOutlineUser } from 'react-icons/hi';
import { AiOutlineDown } from 'react-icons/ai';
import { BiHappyBeaming } from "react-icons/bi";
import apiClient from '../../api/axiosConfig';
import currencyService from '../../api/currencyService';
import { useUser } from '../../store/hooks';
import toast from 'react-hot-toast';
import BookingModal from '../../components/booking/BookingModal';
import MegaSessionCard from '../../components/megaSession/MegaSessionCard';
import MentorReviewsPreview from '../../components/reviews/MentorReviewsPreview';
import { megaSessionService, reviewService } from '../../api/services';
import Seo from '../../components/seo/Seo';
import BrandLogo from '../../components/shared/BrandLogo';
import JsonLd from '../../components/seo/JsonLd';
import { resolveMediaUrl } from '../../utils/siteUrl';
import { buildPersonSchema, buildBreadcrumbSchema } from '../../utils/structuredData';


const MentorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [convertedSessions, setConvertedSessions] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [mentorMegaSessions, setMentorMegaSessions] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [mentorReviews, setMentorReviews] = useState([]);

  const faqs = [
    {
      question: "How does a 1:1 video session actually work?",
      answer: "You start by exploring our global roster of trusted mentors. Once you find someone aligned with your goals, simply pick a time and book your session. At your scheduled slot, you'll join a private Google video call where you can ask your questions and get laser-focused guidance that fits your needs."
    },
    {
      question: "What's the usual duration of a session?",
      answer: "Mentors offer sessions in 15, 30, 60, or 90 minute lengths (based on what each mentor supports). You'll choose the duration that suits your goals during booking."
    },
    {
      question: "Is 20 minutes really enough to get value?",
      answer: "Absolutely. You can have major breakthroughs even in short sessions. Whether it's clarity on your next big move, refining your pitch, or validating a strategy, the world-class mentors know how to make every minute count."
    },
    {
      question: "Can I meet the same mentor more than once?",
      answer: "Yes, and it's recommended too. Pro tip: for ongoing support, reserve multiple sessions ahead of time through bundles to avoid missing already limited slots that run out quickly. Several mentees maintain long-term mentor relationships to receive consistent guidance through regular check-ins."
    },
    {
      question: "What time zone are the sessions displayed in?",
      answer: "All session times automatically convert to your local time zone. No need to calculate time differences, we've handled that for you."
    },
    {
      question: "Do you accept mentees from outside my country?",
      answer: "Definitely. Mentorick is built for a global audience. Whether you're in Karachi, New York, Dubai, London, or Sydney, you can book sessions with world-class mentors across industries."
    },
    {
      question: "What if a mentor's calendar is full?",
      answer: "Some mentors have limited availability due to high demand. If you see \"Sold Out,\" check back soon. Many mentors open new slots weekly or monthly."
    },
    {
      question: "How often do mentors update their schedules?",
      answer: "It varies by mentor. Some release new times every week, while others drop fresh availability once a month. If someone you're eyeing is booked up, we suggest subscribing to our newsletter or checking in regularly to stay updated."
    },
    {
      question: "Can I cancel or reschedule my session?",
      answer: "Yes. You can cancel or reschedule anytime via your dashboard. Just make sure to do so before a 24hrs window. Our full policy is outlined on the site."
    },
    {
      question: "How do I schedule a session with a mentor?",
      answer: "Simply browse our mentor directory, select a mentor whose expertise aligns with your goals, choose an available time slot, and book your session—all through our user-friendly platform."
    },
    {
      question: "What topics can I discuss with a mentor?",
      answer: "You can seek advice on a wide range of topics, including but not limited to: Entrepreneurship, startups, investments, funding, and scaling; Career development and transitions; Marketing and branding strategies; Product development and innovation; Leadership and team management; Personal growth and mindset."
    },
    {
      question: "Is international booking supported?",
      answer: "Yes, Mentorick supports mentees worldwide. Session times are displayed in your local timezone, and payments can be made using major debit/credit cards in USD."
    }
  ];

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

        // Fetch mentor's mega sessions
        try {
          const megaRes = await megaSessionService.getMegaSessions({ upcoming: true });
          if (megaRes.megaSessions) {
            // Filter mega sessions for this specific mentor
            const mentorSessions = megaRes.megaSessions.filter(session => 
              session.mentor._id === id
            );
            setMentorMegaSessions(mentorSessions);
          }
        } catch (error) {
          console.error('Error fetching mega sessions:', error);
          setMentorMegaSessions([]);
        }

        try {
          const reviewsData = await reviewService.getMentorReviews(id, { page: 1, limit: 3 });
          setReviewStats(reviewsData.stats || {
            averageRating: profileData.averageRating || 0,
            reviewCount: profileData.reviewCount || 0,
          });
          setMentorReviews(reviewsData.reviews || []);
        } catch (error) {
          console.error('Error fetching mentor reviews:', error);
          setReviewStats({
            averageRating: profileData.averageRating || 0,
            reviewCount: profileData.reviewCount || 0,
          });
          setMentorReviews([]);
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
      toast.error('Mentor cannot book a session');
      console.log("Mentor cannot book a session")
      return;
    }

    setShowBookingModal(true);
  };

  const handleBookingSuccess = (booking) => {
    setShowBookingModal(false);
    toast.success('Session booked successfully! Check your dashboard for details.');
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

  const mentorHeadshotUrl = resolveMediaUrl(profile.headshot);
  const mentorOgImage = mentorHeadshotUrl || '/seo/og-mentor-default.svg';
  const mentorTopics = profile.topics?.slice(0, 3).join(', ') || 'mentorship';
  const seoDescription = `Book a 1:1 mentoring session with ${profile.fullName}. ${profile.title}. Topics include ${mentorTopics}.`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={`${profile.fullName} | ${profile.title} | Mentorick`}
        description={seoDescription}
        canonical={`/mentor/${id}`}
        image={mentorOgImage}
        type="profile"
      />
      <JsonLd
        data={[
          buildPersonSchema({
            fullName: profile.fullName,
            title: profile.title,
            about: profile.about,
            headshotUrl: mentorHeadshotUrl,
            topics: profile.topics,
            socialLinks: profile.socialLinks,
            mentorId: id,
          }),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Mentors', path: '/mentors' },
            { name: profile.fullName, path: `/mentor/${id}` },
          ]),
        ]}
      />
      <header className="bg-white shadow-sm border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BrandLogo className="h-10 w-auto object-contain" />
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Book Session
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  <img 
                    src={profile.headshot || '/api/placeholder/120/120'} 
                    alt={profile.fullName}
                    loading="lazy"
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
                  {/* <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                  </div> */}
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
                <div className="text-2xl font-bold text-primary mb-1">
                  {reviewStats.reviewCount > 0
                    ? reviewStats.averageRating.toFixed(1)
                    : (profile.averageRating > 0 ? profile.averageRating.toFixed(1) : 'New')}
                </div>
                <div className="text-sm text-gray-600">
                  Rating{reviewStats.reviewCount > 0 ? ` (${reviewStats.reviewCount})` : ''}
                </div>
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
                className="w-full bg-primary cursor-pointer text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors mb-3"
              >
                Book a Session
              </button>
              <p className="text-xs text-gray-500 text-center">
                {user ? 'Choose your preferred time slot' : 'Login required to book sessions'}
              </p>
            </div>
          </div>
        </div>

      {/* Mega Sessions Section */}
      {mentorMegaSessions.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Upcoming Mega Sessions with {profile?.fullName}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {mentorMegaSessions.map((session) => (
                <MegaSessionCard
                  key={session._id}
                  session={session}
                  mentorProfile={{
                    fullName: profile?.fullName,
                    title: profile?.title,
                    headshot: profile?.headshot,
                  }}
                >
                  <Link
                    to="/mega-sessions"
                    className="flex w-full items-center justify-center rounded-lg !bg-gradient-to-r !from-violet-600 !to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:!from-violet-700 hover:!to-indigo-700"
                  >
                    View Details & Join
                  </Link>
                </MegaSessionCard>
              ))}
            </div>
          </div>
        </section>
      )}

      <MentorReviewsPreview
        mentorId={id}
        mentorName={profile?.fullName}
        stats={reviewStats}
        reviews={mentorReviews}
      />

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <AiOutlineDown className="h-5 w-5" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: "easeInOut",
                        opacity: { duration: 0.2 }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        mentorId={id}
        mentorName={profile?.fullName}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default MentorPublicProfile;
