import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { mentorService } from '../../api/services';
import currencyService from '../../api/currencyService';

const MentorSlider = ({ mentors = [], searchQuery = "", sortBy = "rating" }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [fetchedMentors, setFetchedMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const sliderRef = useRef(null);

  // Fetch mentors from backend
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const mentorProfiles = await mentorService.getAllMentors();
        // Transform backend data to match frontend format
        const transformedMentors = await Promise.all(
          mentorProfiles.map(async (mentor, index) => {
            let priceDisplay = '$50/session'; // fallback price
            
            if (mentor.sessionDurations.length > 0) {
              const session = mentor.sessionDurations[0];
              if (session.priceUSD > 0) {
                priceDisplay = currencyService.formatCurrency(session.priceUSD, 'USD') + '/session';
              } else if (session.pricePKR > 0) {
                // Convert PKR to USD for display consistency
                const usdPrice = await currencyService.convertCurrency(session.pricePKR, 'PKR', 'USD');
                priceDisplay = currencyService.formatCurrency(usdPrice, 'USD') + '/session';
              }
            }

            return {
              id: mentor.user.id,
              name: mentor.fullName,
              title: mentor.title,
              image: mentor.headshot || `/mentor-signup-${(index % 4) + 1}.jpeg`, // fallback to mock images
              tags: mentor.topics.slice(0, 2), // Show first 2 topics
              price: priceDisplay,
              rating: 4.5 + Math.random() * 0.5 // Random rating between 4.5-5.0 (hardcoded as requested)
            };
          })
        );
        
        setFetchedMentors(transformedMentors);
        setFetchError(false);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setFetchedMentors([]);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if no mentors prop provided
    if (mentors.length === 0) {
      fetchMentors();
    } else {
      setLoading(false);
    }
  }, []);

  // Reset slider index when search or sort changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, sortBy]);
  
  const baseMentors = mentors.length > 0 ? mentors : fetchedMentors;

  // Filter mentors based on search query
  const filteredMentors = baseMentors.filter(mentor => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      mentor.name.toLowerCase().includes(searchLower) ||
      mentor.title.toLowerCase().includes(searchLower) ||
      mentor.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Sort mentors based on sortBy option
  const displayMentors = [...filteredMentors].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        // Extract price value and sort by it
        const priceA = parseFloat(a.price.replace(/[$\/\w]/g, ''));
        const priceB = parseFloat(b.price.replace(/[$\/\w]/g, ''));
        return priceA - priceB;
      case 'experience':
        // Sort by title/experience level (assuming more experienced have longer titles)
        return b.title.length - a.title.length;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
      default:
        return b.rating - a.rating;
    }
  });

  // Calculate how many cards to show based on screen size
  const getCardsToShow = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 4; // lg: 4 cards
      if (window.innerWidth >= 768) return 2;  // md: 2 cards
      return 1; // mobile: 1 card
    }
    return 1;
  };

  const [cardsToShow, setCardsToShow] = React.useState(getCardsToShow());

  React.useEffect(() => {
    const handleResize = () => {
      setCardsToShow(getCardsToShow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev >= displayMentors.length - cardsToShow ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev <= 0 ? displayMentors.length - cardsToShow : prev - 1
    );
  };

  // Touch and drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 50) { // Threshold for slide change
      if (walk > 0 && currentIndex > 0) {
        prevSlide();
        setIsDragging(false);
      } else if (walk < 0 && currentIndex < displayMentors.length - cardsToShow) {
        nextSlide();
        setIsDragging(false);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 50) { // Threshold for slide change
      if (walk > 0 && currentIndex > 0) {
        prevSlide();
        setIsDragging(false);
      } else if (walk < 0 && currentIndex < displayMentors.length - cardsToShow) {
        nextSlide();
        setIsDragging(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Navigation function
  const handleMentorClick = (mentorId) => {
    if (!isDragging) { // Only navigate if not dragging
      navigate(`/mentor/${mentorId}`);
    }
  };

  return (
    <div className="relative">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : displayMentors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-gray-500 text-lg mb-2">
            {searchQuery ? 'No mentors found' : 'No mentors available'}
          </div>
          <div className="text-gray-400 text-sm">
            {searchQuery
              ? `Try adjusting your search for "${searchQuery}"`
              : fetchError
                ? 'Unable to load mentors right now. Please try again later.'
                : 'Check back soon — new mentors are joining regularly.'}
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow -ml-4"
            disabled={displayMentors.length <= cardsToShow}
          >
            <AiOutlineLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow -mr-4"
            disabled={displayMentors.length <= cardsToShow}
          >
            <AiOutlineRight className="h-5 w-5 text-gray-600" />
          </button>

          {/* Slider Container */}
          <div className="overflow-hidden">
            <div 
              ref={sliderRef}
              className={`flex transition-transform duration-300 ease-in-out select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
            >
              {displayMentors.map((mentor) => (
                <div 
                  key={mentor.id} 
                  className="flex-shrink-0 px-2 sm:px-3"
                  style={{ width: `${100 / cardsToShow}%` }}
                >
                  <div 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
                    onClick={() => handleMentorClick(mentor.id)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={mentor.image}
                        alt={mentor.name}
                        loading="lazy"
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
                            e.stopPropagation(); // Prevent card click when button is clicked
                            handleMentorClick(mentor.id);
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(displayMentors.length / cardsToShow) }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * cardsToShow)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / cardsToShow) === index
                    ? 'bg-primary-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MentorSlider;
