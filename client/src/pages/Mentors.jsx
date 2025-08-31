import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import Button from "../components/shared/Button";
import FormInput from "../components/shared/FormInput";
import MentorSlider from "../components/shared/MentorSlider";
import Footer from "../components/shared/Footer";
import { mentorService } from "../api/services";
import currencyService from "../api/currencyService";
import {
  AiOutlineSearch,
  AiOutlineStar,
  AiOutlineFilter,
  AiOutlineUser,
  AiOutlineClockCircle,
  AiOutlineVideoCamera,
  AiOutlineMenu,
} from "react-icons/ai";
import { BsGrid3X3Gap, BsListUl } from "react-icons/bs";

const Mentors = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "tech", label: "Technology" },
    { value: "business", label: "Business" },
    { value: "marketing", label: "Marketing" },
    { value: "design", label: "Design" },
    { value: "leadership", label: "Leadership" },
    { value: "startups", label: "Startups" },
    { value: "career", label: "Career Development" },
  ];

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-50", label: "$0 - $50" },
    { value: "50-100", label: "$50 - $100" },
    { value: "100-200", label: "$100 - $200" },
    { value: "200+", label: "$200+" },
  ];

  const sortOptions = [
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "experience", label: "Most Experienced" },
    { value: "newest", label: "Newest Mentors" },
  ];

  // Fetch mentors from backend
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const mentorProfiles = await mentorService.getAllMentors();
        
        // Transform backend data to match frontend format
        const transformedMentors = await Promise.all(
          mentorProfiles.map(async (mentor, index) => {
            let priceDisplay = '$50/session';
            let priceValue = 50;
            
            if (mentor.sessionDurations.length > 0) {
              const session = mentor.sessionDurations[0];
              if (session.priceUSD > 0) {
                priceValue = session.priceUSD;
                priceDisplay = currencyService.formatCurrency(session.priceUSD, 'USD') + '/session';
              } else if (session.pricePKR > 0) {
                const usdPrice = await currencyService.convertCurrency(session.pricePKR, 'PKR', 'USD');
                priceValue = usdPrice;
                priceDisplay = currencyService.formatCurrency(usdPrice, 'USD') + '/session';
              }
            }

            return {
              id: mentor.user.id,
              name: mentor.fullName,
              title: mentor.title,
              image: mentor.headshot || `/mentor-signup-${(index % 4) + 1}.jpeg`,
              tags: mentor.topics.slice(0, 3),
              price: priceDisplay,
              priceValue: priceValue,
              rating: 4.5 + Math.random() * 0.5,
              sessions: Math.floor(Math.random() * 100) + 10,
            };
          })
        );
        
        setMentors(transformedMentors);
      } catch (error) {
        console.error('Error fetching mentors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // Filter and sort mentors
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || 
                           mentor.tags.some(tag => tag.toLowerCase().includes(selectedCategory));
    
    const matchesPrice = priceRange === "all" || 
                        (priceRange === "0-50" && mentor.priceValue <= 50) ||
                        (priceRange === "50-100" && mentor.priceValue > 50 && mentor.priceValue <= 100) ||
                        (priceRange === "100-200" && mentor.priceValue > 100 && mentor.priceValue <= 200) ||
                        (priceRange === "200+" && mentor.priceValue > 200);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "price-low":
        return a.priceValue - b.priceValue;
      case "price-high":
        return b.priceValue - a.priceValue;
      case "experience":
        return b.experience - a.experience;
      case "newest":
        return Math.random() - 0.5; // Random for demo
      default:
        return 0;
    }
  });

  const handleMentorClick = (mentorId) => {
    navigate(`/mentor/${mentorId}`);
  };

  const MentorCard = ({ mentor, isListView = false }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className={`${
        isListView ? 'flex items-center space-x-6 p-6' : 'p-0'
      } bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col`}
      onClick={() => handleMentorClick(mentor.id)}
    >
      {isListView ? (
        // List view layout
        <>
          <div className="flex-shrink-0">
            <div className="w-20 h-20 relative">
              <img
                src={mentor.image}
                alt={mentor.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{mentor.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{mentor.title}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {mentor.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right ml-4">
                <div className="flex items-center justify-end mb-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm text-gray-600 ml-1">{mentor.rating.toFixed(1)}</span>
                </div>
                
                <div className="text-lg font-semibold text-gray-900 mb-2">{mentor.price}</div>
                
                <Button
                  variant="solid"
                  size="sm"
                  className="bg-primary-500 hover:bg-primary-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMentorClick(mentor.id);
                  }}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Grid view layout (matches homepage exactly)
        <>
          <div className="aspect-square relative">
            <img
              src={mentor.image}
              alt={mentor.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/mentor-signup.jpg'; // Fallback image
              }}
            />
          </div>
          
          <div className="p-3 sm:p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{mentor.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 min-h-[2.5rem] sm:min-h-[2.75rem] overflow-hidden" 
               style={{
                 display: '-webkit-box',
                 WebkitLineClamp: 2,
                 WebkitBoxOrient: 'vertical',
                 textOverflow: 'ellipsis'
               }}
            >
              {mentor.title}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-2 sm:mb-3 min-h-[1.5rem]">
              {mentor.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">{mentor.price}</span>
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="text-xs sm:text-sm text-gray-600 ml-1">{parseFloat(mentor.rating).toFixed(1)}</span>
              </div>
            </div>
            
            <div className="mt-auto">
              <Button
                variant="solid"
                size="sm"
                className="w-full bg-primary-500 hover:bg-primary-600 text-xs sm:text-sm py-1.5 sm:py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMentorClick(mentor.id);
                }}
              >
                View Profile
              </Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <MainLayout 
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <AiOutlineMenu className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 ml-2 lg:ml-0">Mentorick</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Connect with World-Class
              <span className="text-primary-600"> Mentors</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Get personalized guidance from industry leaders, successful entrepreneurs, and expert professionals who've walked the path you're on.
            </motion.p>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relativ">
                <AiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <FormInput
                  type="text"
                  placeholder="Search by name, expertise, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 py-4 text-lg rounded-full border-2 bg-white border-white shadow-lg focus:border-primary-500"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Mentors Slider */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Mentors</h2>
              <p className="text-lg text-gray-600">Top-rated mentors from our community</p>
            </motion.div>
            
            <MentorSlider mentors={mentors.slice(0, 8)} />
          </div>
        </section>

        {/* Filters and Results */}
        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <AiOutlineFilter className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Filters:</span>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {(selectedCategory !== "all" || priceRange !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setPriceRange("all");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading amazing mentors...</p>
              </div>
            ) : (
              <>
                {/* Results */}
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}>
                  {sortedMentors.map((mentor) => (
                    <MentorCard 
                      key={mentor.id} 
                      mentor={mentor} 
                      isListView={viewMode === "list"}
                    />
                  ))}
                </div>

                {/* No Results */}
                {sortedMentors.length === 0 && (
                  <div className="text-center py-16">
                    <AiOutlineSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your filters or search terms to find the perfect mentor.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory("all");
                        setPriceRange("all");
                        setSearchQuery("");
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </MainLayout>
  );
};

export default Mentors;
