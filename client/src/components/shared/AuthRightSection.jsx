import React from 'react';
import AnimatedTestimonialFeed from './AnimatedTestimonialFeed';
import { HiOutlineRocketLaunch } from "react-icons/hi2";
import { FaRegStar, FaRegClock , FaCheckCircle } from "react-icons/fa";

// Move testimonials outside component to prevent recreation on every render
const testimonials = [
  {
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face",
    name: "Sarah Johnson",
    role: "Software Engineer",
    feedback: "Found an amazing mentor who helped me transition into tech."
  },
  {
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    name: "Michael Chen",
    role: "Product Manager", 
    feedback: "The personalized guidance was exactly what I needed."
  },
  {
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    name: "David Rodriguez",
    role: "Data Scientist",
    feedback: "My mentor helped me land my dream job at a top tech company."
  },
  {
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
    name: "Emily Watson",
    role: "UX Designer",
    feedback: "Amazing platform! Found the perfect mentor for my career goals."
  },
  {
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
    name: "James Wilson",
    role: "Marketing Director",
    feedback: "The networking opportunities here are incredible."
  },
  {
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face",
    name: "Lisa Thompson",
    role: "Business Analyst",
    feedback: "Gained valuable insights that accelerated my career growth."
  }
];

const AuthRightSection = React.memo(({ heading, subheading }) => {
  return (
    <div className="w-full lg:w-1/2 hidden lg:flex bg-primary-800 flex-col justify-center p-12">
      <div className="max-w-md mx-auto text-center text-white">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-4">{heading}</h1>
        <p className="text-blue-100 mb-8">
          {subheading}
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <HiOutlineRocketLaunch className="text-2xl text-white" />
            </div>
            <div className="text-2xl font-bold">500+</div>
            <div className="text-sm text-blue-200">Expert Mentors</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <FaRegStar className="text-2xl text-white" />
            </div>
            <div className="text-2xl font-bold">95%</div>
            <div className="text-sm text-blue-200">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <FaRegClock className="text-2xl text-white" />
            </div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm text-blue-200">Support</div>
          </div>
        </div>

        {/* Animated Testimonials */}
        <div className="mb-8">
          <AnimatedTestimonialFeed testimonials={testimonials} />
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center text-blue-200">
          <FaCheckCircle className="mr-2" />
          <span className="text-sm">Trusted by leading companies worldwide</span>
        </div>
      </div>
    </div>
  );
});

AuthRightSection.displayName = 'AuthRightSection';

export default AuthRightSection;
