import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/shared/Button";
import MentorSlider from "../components/shared/MentorSlider";
import Footer from "../components/shared/Footer";
import { PiBriefcaseLight } from "react-icons/pi";
import {
  AiOutlineSearch,
  AiOutlineCheck,
  AiOutlineClockCircle,
  AiOutlineVideoCamera,
  AiOutlineStar,
  AiOutlineTeam,
  AiOutlineMessage,
  AiOutlineHeart,
  AiOutlineBulb,
  AiOutlineBgColors,
  AiOutlineDown,
} from "react-icons/ai";
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcPaypal,
  FaCcApplePay,
  FaGooglePay,
  FaInstagram,
  FaYoutube,
  FaFacebook,
  FaLinkedin,
  FaGoogle,
  FaMicrosoft,
  FaAmazon,
  FaApple,
  FaTwitter,
  FaSlack,
} from "react-icons/fa";
import { SiShopify, SiStripe, SiSalesforce, SiAdobe } from "react-icons/si";
import { useUser } from "../store/hooks";

const Homepage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [email, setEmail] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const user = useUser();


  const faqs = [
    {
      question: "What is Mentorick?",
      answer:
        "Mentorick is a 1:1 video mentorship platform connecting you to top global leaders in business, tech, content, leadership, personal growth, and more. You tell your challenges to mentors, ask hard questions, request expert advice through their precious experience — and get direct, personalised, real-time advice for your case live. Unlike vague, generalised, recorded advice on the internet.",
    },
    {
      question: "How do I book a video call with a mentor?",
      answer:
        "Simply log in, explore mentor profiles, pick a time, and book instantly. You connect via a video call at your chosen time with no back-and-forth messaging or delays.",
    },
    {
      question: "Are the video calls truly 1:1 and live?",
      answer:
        "Yes. Every session is a live, private, 1-on-1 video call with your favourite celebrity mentor. Dreamy, right?",
    },
    {
      question: "Is there a membership or subscription?",
      answer:
        "No. You only pay for the sessions you book. And no hidden fees.",
    },
    {
      question: "What tools do I need?",
      answer:
        "A device + internet. All calls happen over Zoom or Google Meet. Easy-peasy.",
    },
    {
      question: "Is there a limit on how many calls I can book?",
      answer:
        "No. You can book unlimited calls across different mentors based on your needs.",
    },
    {
      question: "Can I talk to the same mentor multiple times?",
      answer:
        "Absolutely. Book as many sessions as you like. Get your face known to them ;)",
    },
    {
      question: "What industries do mentors come from?",
      answer:
        "Mentors on Mentorick span tech, e-commerce, startups, content creation, freelancing, leadership, product, marketing, investing, and personal development. This is just a start. You'll see much more soon.",
    },
    {
      question: "Can I talk about personal and career challenges?",
      answer:
        "Absolutely. Whether it's burnout, confusion, or decision paralysis — your mentor is here to guide, not judge.",
    },
    {
      question: "Is there a dashboard to manage bookings?",
      answer:
        "Yes. Your dashboard lets you view available mentors, book and manage sessions, track history, give feedback, and stay organised.",
    },
    {
      question: "Is Mentorick good for startup founders?",
      answer:
        "100%! Whether you're ideating, building, scaling, or fundraising — Mentorick gives you a shortcut to clarity through people who've already done it. With mentors, you'll be way ahead of the others from the beginning.",
    },
    {
      question: "Do mentors really refer or connect mentees to opportunities?",
      answer:
        "Yes — mentors are allowed to refer or connect mentees to their networks when they feel it's the right fit. Being in the good books of top performers can open doors you never imagined.",
    },
    {
      question: "Why are these busy leaders offering their precious time?",
      answer:
        "Our mentors are passionate about giving back, building their legacy, and discovering fresh talent. They enjoy supporting a curated community of forward-thinkers and change-makers like yourself.",
    },
    {
      question: "What if a mentor's calendar is full?",
      answer:
        "Some mentors have limited availability due to high demand. If you see \"Sold Out,\" check back soon—many mentors open new slots weekly or monthly.",
    },
  ];

  return (
    <MainLayout 
      isMobileMenuOpen={isMobileMenuOpen} 
      setIsMobileMenuOpen={setIsMobileMenuOpen}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - left side */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-primary-600">Mentorick</span>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Skip the struggle, search your mentor"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Login button and hamburger */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Desktop Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hidden md:block text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="rating">Sort By Rating</option>
                <option value="price">Sort By Price</option>
                <option value="experience">Sort By Experience</option>
                <option value="name">Sort By Name</option>
              </select>

              {/* Desktop Mission Link */}
              <a
                href="/our-why"
                target="_blank"
                className="hidden lg:block text-sm text-primary-600 hover:text-gray-900"
              >
                Our 'Why'
              </a>

                {!user && (
              <Button onClick={() => navigate('/login')} variant="solid" size="sm">
                Login
              </Button>
                )}
              {/* Mobile hamburger menu - right of login */}
              <div className="md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your mentor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            1:1 Access to your DREAM MENTOR.
            <br />
            <span className="text-primary-500">Just a Call Away.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Accelerate. Focus. Win. The mentorship and guidance to avoid
            roadblocks and hit your goals.
          </p>

          <Button
            variant="solid"
            size="lg"
            className="mb-8 bg-primary-500 hover:bg-primary-600 text-sm"
            onClick={() => navigate('/mentors')}
          >
            Find My Mentor
          </Button>

          {/* Company Logos Carousel */}
          <div className="mt-5">
            <div className="overflow-hidden">
              <div className="flex animate-scroll space-x-8">
                {/* First set of logos */}
                <div className="flex items-center space-x-8 min-w-max">
                  <FaGoogle className="h-8 w-8 text-blue-500" />
                  <FaMicrosoft className="h-8 w-8 text-blue-600" />
                  <FaAmazon className="h-8 w-8 text-orange-500" />
                  <FaApple className="h-8 w-8 text-gray-700" />
                  <FaInstagram className="h-8 w-8 text-pink-500" />
                  <FaYoutube className="h-8 w-8 text-red-500" />
                  <FaFacebook className="h-8 w-8 text-blue-600" />
                  <FaLinkedin className="h-8 w-8 text-blue-700" />
                  <FaTwitter className="h-8 w-8 text-blue-400" />
                  <SiShopify className="h-8 w-8 text-green-600" />
                  <SiStripe className="h-8 w-8 text-purple-600" />
                  <SiSalesforce className="h-8 w-8 text-blue-500" />
                  <SiAdobe className="h-8 w-8 text-red-600" />
                  <FaSlack className="h-8 w-8 text-purple-500" />
                </div>
                {/* Duplicate set for seamless loop */}
                <div className="flex items-center space-x-8 min-w-max">
                  <FaGoogle className="h-8 w-8 text-blue-500" />
                  <FaMicrosoft className="h-8 w-8 text-blue-600" />
                  <FaAmazon className="h-8 w-8 text-orange-500" />
                  <FaApple className="h-8 w-8 text-gray-700" />
                  <FaInstagram className="h-8 w-8 text-pink-500" />
                  <FaYoutube className="h-8 w-8 text-red-500" />
                  <FaFacebook className="h-8 w-8 text-blue-600" />
                  <FaLinkedin className="h-8 w-8 text-blue-700" />
                  <FaTwitter className="h-8 w-8 text-blue-400" />
                  <SiShopify className="h-8 w-8 text-green-600" />
                  <SiStripe className="h-8 w-8 text-purple-600" />
                  <SiSalesforce className="h-8 w-8 text-blue-500" />
                  <SiAdobe className="h-8 w-8 text-red-600" />
                  <FaSlack className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="bg-primary-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <p className="text-xl md:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
              <span className="inline-block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-shimmer">
                Unlimited 1:1 video calls.
              </span>
              <br />
              <span className="inline-block animate-slide-in-right text-white font-extrabold">
                Personalised advice.
              </span>
              <br />
              <span className="inline-block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-shimmer">
                World-class leaders.
              </span>
              <br />
              <span className="inline-block animate-slide-in-right text-white mt-2">
                All in 1 place.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Mentor Slider */}
      <section className="bg-gray-50 py-16">
        <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MentorSlider searchQuery={searchQuery} sortBy={sortBy} />
          <div className="flex justify-center">
            <Button
              variant="solid"
              size="lg"
              className="mb-8 bg-primary-500 hover:bg-primary-600 mt-10 text-sm"
              onClick={() => navigate('/mentors')}
            >
              Find My Mentor
            </Button>
          </div>
        </div>
      </section>

      {/* Become investor-ready section */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-5 text-white">
            Become investor-ready, launch-ready, or scale-ready
          </h2>
          <h3 className="text-xl font-bold text-center mb-12 text-white">
            Get advised by people who’ve:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Built 7–9 figure businesses
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Impacted lives through content
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Founded and served unicorns
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Navigated life-altering decisions
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Funded and made winning $M exits
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Transformed the world and will now do yours
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <AiOutlineCheck className="h-6 w-6 text-accent-500 mt-0.5 flex-shrink-0" />
                <span className="text-white">
                  Transformed the world and will now do yours
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Slider */}
      <section className="bg-gray-50 py-16">
        <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MentorSlider searchQuery={searchQuery} sortBy={sortBy} />
          <div className="flex justify-center">
            <Button
              variant="solid"
              size="lg"
              className="mb-8 bg-primary-500 hover:bg-primary-600 mt-10 text-sm"
              onClick={() => navigate('/mentors')}
            >
              Find My Mentor
            </Button>
          </div>
        </div>
      </section>

      {/* The Shortcut Exists section */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-3">
            The Shortcut Exists. You Just Found It.
          </h2>
          <p className="text-xl font-bold mb-8">
            Mentorick isn’t a one-time advice portal. You can:
          </p>

          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <AiOutlineCheck className="h-6 w-6 text-primary-500" />
              <span className="text-gray-700">
                Reconnect with your mentor repeatedly
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <AiOutlineCheck className="h-6 w-6 text-primary-500" />
              <span className="text-gray-700">
                Save yourself from cruel trial and error
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <AiOutlineCheck className="h-6 w-6 text-primary-500" />
              <span className="text-gray-700">
                Build a network of high-value people
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <AiOutlineCheck className="h-6 w-6 text-primary-500" />
              <span className="text-gray-700">
                Fun part? Pay per call. On your schedule. On your budget.
              </span>
            </div>
          </div>

          <Button
            variant="solid"
            size="lg"
            className="bg-primary-500 hover:bg-primary-600 text-sm"
          >
            Save yourself time, money, and frustration
          </Button>
        </div>
      </section>

      {/* Three Feature Cards */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineTeam className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl text-white font-semibold mb-2">Find a mentor</h3>
              <p className="text-white">
                Pick a time that matches you both and find the perfect match for
                your needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineVideoCamera className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl text-white font-semibold mb-2">
                Jump on a 1:1 video call
              </h3>
              <p className="text-white">
                Leave with clarity + direction, schedule and attend personalized
                video sessions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineStar className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl text-white font-semibold mb-2">
                Review your session
              </h3>
              <p className="text-white">
                Get actionable insights and feedback to accelerate your growth
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className=" max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MentorSlider searchQuery={searchQuery} sortBy={sortBy} />
          <div className="flex justify-center">
            <Button
              variant="solid"
              size="lg"
              className="mb-8 bg-primary-500 hover:bg-primary-600 mt-10 text-sm"
              onClick={() => navigate('/mentors')}
            >
              Find My Mentor
            </Button>
          </div>
        </div>
      </section>

      {/* Power of Being in the Right Circles */}
      <section className="bg-primary-50 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            The Power of Being in the Right Circles
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Data-driven results from mentorship connections
          </p>

          {/* Animated Statistics Slider */}
          <div className="relative">
            <div className="flex animate-scroll space-x-8">
              {/* Stat Card 1 */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-primary-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-primary-500">3x</div>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <AiOutlineStar className="h-6 w-6 text-primary-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Startups with mentors are 3 times more likely to secure investment funding
                </p>
              </div>

              {/* Stat Card 2 */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-green-500">83%</div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <AiOutlineTeam className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Mentored businesses experience an average of 83% growth in annual revenue
                </p>
              </div>

              {/* Stat Card 3 */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-blue-500">70%</div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <AiOutlineHeart className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Mentored small businesses have a 70% survival rate over five years, double the rate of non-mentored businesses
                </p>
              </div>

              {/* Stat Card 4 */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-purple-500">80%</div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <AiOutlineBulb className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Investors are 80% more likely to fund startups referred by trusted mentors
                </p>
              </div>

              {/* Stat Card 5 */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-orange-500">3x</div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AiOutlineMessage className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Founders with mentors gain access to 3x larger investor and customer networks through warm introductions
                </p>
              </div>

              {/* Stat Card 6 */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-red-500">30%</div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AiOutlineClockCircle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Mentorship reduces time to funding by 30%, helping founders build investor-grade decks and positioning
                </p>
              </div>

              {/* Duplicate cards for seamless loop */}
              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-primary-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-primary-500">3x</div>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <AiOutlineStar className="h-6 w-6 text-primary-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Startups with mentors are 3 times more likely to secure investment funding
                </p>
              </div>

              <div className="flex-shrink-0 bg-white rounded-xl shadow-lg p-6 w-80 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl font-bold text-green-500">83%</div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <AiOutlineTeam className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Mentored businesses experience an average of 83% growth in annual revenue
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentorship Categories */}
      <section className="bg-white py-16 mt-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-20">
            Talk about anything. 
            <br />
            Get life-changing guidance for everything.
          </h2>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiBriefcaseLight className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-semibold">Business & Career</h3>
              <p className="text-sm text-gray-600 mt-2">
                 Entrepreneurship, Startups, E-commerce, Freelancing, Marketing, Branding, Product Launches, Franchising, Career Pivots
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineBulb className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-semibold">Professional Growth</h3>
              <p className="text-sm text-gray-600 mt-2">
                 Personal Branding, Public Speaking, Job Interviews, LinkedIn Growth, Negotiation Tactics
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineBgColors className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-semibold">Creative & Tech</h3>
              <p className="text-sm text-gray-600 mt-2">
                AI, Content Creation, Podcasting, YouTube, Design, UX/UI, Data Science, Programming
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AiOutlineHeart className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="font-semibold">Personal Life</h3>
              <p className="text-sm text-gray-600 mt-2">
                Burnout, Confidence, Work-Life Balance, Relationships, Mental Clarity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Motivational Statement Section */}
      <section className="relative bg-gradient-to-b py-10 overflow-hidden bg-primary-100">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* First Statement */}
            <div className="animate-fade-in-up">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-extraboldtext-gray-700 leading-tight">
                That's not all.
              </h2>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 mt-4 animate-bounce-subtle">
                We're just starting!
              </p>
            </div>
            
            {/* Divider
            <div className="flex items-center justify-center space-x-4 my-8">
              <div className="w-16 h-0.5 bg-gray-600 opacity-50"></div>
              <div className="w-4 h-4 bg-gray-600 rounded-full opacity-75 animate-ping"></div>
              <div className="w-16 h-0.5 bg-gray-600 opacity-50"></div>
            </div> */}
            
            {/* Second Statement */}
            <div className="animate-slide-in-scale">
              <h3 className="text-2xl md:text-3xl lg:text-5xl font-black text-gray-700 leading-tight">
                This Is Bigger Than
              </h3>
              <span className="text-2xl md:text-3xl lg:text-5xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-shimmer">
                You Think
              </span>
            </div>
            
            {/* Call to Action */}
            <div className="pt-4 animate-fade-in-delayed">
              <Button
                variant="solid"
                size="lg"
                className="bg-primary-500 text-primary-600 hover:bg-gray-100 font-bold px-4 py-2 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Start Your Journey Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Internet Advice vs Mentor Advice */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              You don't need to binge-watch 99 YT videos.
            </h2>
            <p className="text-xl text-gray-600">
              You need 1 answer from the right person.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Internet Advice Column */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-900">Internet Advice</h3>
              </div>
              
              {/* YouTube Video Example */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h4 className="font-semibold text-lg mb-4 text-gray-800">
                  "Start Your 7-Figure Business in 2025 (Step-by-Step)"
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-600">1. Find a market gap</p>
                  <p className="text-gray-600">2. Build a product</p>
                  <p className="text-gray-600">3. Hire a team</p>
                  <p className="text-gray-600">4. Market aggressively</p>
                  <p className="text-gray-600">5. Stay consistent</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span className="text-gray-700">Broad overview</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span className="text-gray-700">
                    Feels like shouting into the void — no clue what applies to your specific situation
                  </span>
                </div>
              </div>
            </div>

            {/* Mentor Advice Column */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-3 h-3 bg-primary-500 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-900">1:1 Live Mentor Advice</h3>
              </div>
              
              {/* Conversation Example */}
              <div className="space-y-4 mb-8">
                {/* Your Question */}
                <div className="border-l-3 border-gray-300 pl-4">
                  <p className="font-medium text-gray-800 mb-2">You:</p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "I want to build a tech-enabled fashion platform that connects small apparel manufacturers in Pakistan to global boutique brands. I've seen the inefficiencies firsthand, but I don't know how to validate or pitch this properly."
                  </p>
                </div>

                {/* Mentor Response */}
                <div className="border-l-3 border-primary-500 pl-4">
                  <p className="font-medium text-primary-700 mb-2">Mentor:</p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "You're solving a supply chain inefficiency. That's not a 'fashion' business, that's B2B SaaS + marketplace potential. You need to start lean: list 20 boutique brands in the UK who'd benefit from authentic, small-batch sourcing. Also, avoid building a full app; start with a curated Notion + WhatsApp ops model and test supply consistency before raising."
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-primary-500 mt-1">✓</span>
                  <span className="text-gray-700">Pinpointed guidance</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-primary-500 mt-1">✓</span>
                  <span className="text-gray-700">
                    Feels like finally being heard — tailored to your exact situation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skip 18 Months */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Skip 18 months of trial & error
            </h2>
            {/* <h3 className="text-2xl md:text-3xl font-semibold text-primary-600 mb-6">
              … in 40 minutes!
            </h3> */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              They've done what you're trying to do. Now, they'll show you how.
            </p>
          </div>

          {/* Benefits List */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Validate or kill your idea fast — no more months wasted building the wrong thing.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Get a step-by-step roadmap tailored to your exact stage, goal, and industry.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Access proven hacks used by 7-figure founders and deal-makers.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Make high-stakes decisions with clarity instead of spiralling into indecision.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Get intro'd to investors, clients, or key partners through your mentor's network.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Receive blunt, actionable feedback — no sugarcoating, no ambiguity.
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Catch mistakes early — avoid 6-month detours with real-time course correction.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Fix your positioning and pitch so people actually say yes (and pay more).
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Learn what to stop doing immediately — and where to 10x your focus.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Upgrade your mindset from operator to leader — and build like a visionary.
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-gray-800 text-lg leading-relaxed">
                    Rewire your response to failure — bounce back fast with mental armor.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-primary-500 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            They've done what you're trying to do
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-gray-50 animate-bounce-subtle text-primary-500 font-semibold py-2 px-4 border border-primary-500 rounded-lg shadow-sm hover:bg-primary-500 hover:text-white transition duration-200">Get access.</button>
            <button className="bg-gray-50 animate-bounce-subtle text-primary-500 font-semibold py-2 px-4 border border-primary-500 rounded-lg shadow-sm hover:bg-primary-500 hover:text-white transition duration-200">Get unstuck</button>
            <button className="bg-gray-50 animate-bounce-subtle text-primary-500 font-semibold py-2 px-4 border border-primary-500 rounded-lg shadow-sm hover:bg-primary-500 hover:text-white transition duration-200">Get ahead</button>
          </div>
        </div>
      </section>

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

      {/* Newsletter Section */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Enjoy $10 off your first session + free tips, discounts,
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            early access to mentors, & secret workshops.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button
              variant="solid"
              className="bg-primary-500 hover:bg-primary-600"
            >
              Yay, Get me in!
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </MainLayout>
  );
};

export default Homepage;
