import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialCard from './TestimonialCard';

const AnimatedTestimonialFeed = React.memo(({ testimonials }) => {
  const [visibleTestimonials, setVisibleTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateTestimonials = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex % testimonials.length;
      const newTestimonial = testimonials[nextIndex];
      
      setVisibleTestimonials((prev) => {
        // New card comes from top, current top moves to bottom, current bottom exits
        return [newTestimonial, prev[0]];
      });
      
      return prevIndex + 1;
    });
  }, [testimonials]);

  useEffect(() => {
    if (!testimonials || testimonials.length === 0) return;
    
    // Initialize with first 2 different testimonials
    setVisibleTestimonials([testimonials[1], testimonials[0]]); // Top card is index 1, bottom is index 0
    setCurrentIndex(2); // Next card to show will be index 2
  }, [testimonials]);

  useEffect(() => {
    if (!testimonials || testimonials.length === 0) return;

    // Set up the animation interval
    const interval = setInterval(updateTestimonials, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, [updateTestimonials]);

  return (
    <div className="h-60 overflow-hidden relative">
      <AnimatePresence mode="popLayout">
        {visibleTestimonials.map((testimonial, index) => (
          <motion.div
            key={`${testimonial.name}-${testimonial.role}-${index}`}
            initial={{ 
              y: index === 0 ? -140 : 0, // New card (index 0) comes from top
              opacity: index === 0 ? 0 : 1
            }}
            animate={{ 
              y: index * 130, // Stack cards: 0px for top, 130px for bottom
              opacity: 1
            }}
            exit={{ 
              y: 260, // Exit at bottom
              opacity: 0
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.6,
              delay: index === 1 ? 0.1 : 0 // Slight delay for bottom card movement
            }}
            className="absolute w-full"
            style={{ zIndex: 10 - index }} // Top card has higher z-index
          >
            <TestimonialCard
              avatar={testimonial.avatar}
              name={testimonial.name}
              role={testimonial.role}
              feedback={testimonial.feedback}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

AnimatedTestimonialFeed.displayName = 'AnimatedTestimonialFeed';

export default AnimatedTestimonialFeed;
