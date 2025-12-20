import React from 'react';
import { motion } from 'framer-motion';

/**
 * Date selector component for booking flow
 * Shows available dates from mentor availability data
 */
const MentorAvailabilityCalendar = ({ availability, selectedDate, onDateSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading available dates...</p>
      </div>
    );
  }

  if (!availability || availability.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No available dates found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Date</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availability.map((dayData) => {
          const isSelected = selectedDate === dayData.date;
          const slotsCount = dayData.slots?.length || 0;
          
          // Parse the date for display
          const dateObj = new Date(dayData.date + 'T00:00:00');
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

          return (
            <motion.button
              key={dayData.date}
              onClick={() => onDateSelect(dayData.date)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{dayName}</div>
              <div className="text-2xl font-bold mt-1">{dayNumber}</div>
              <div className="text-xs text-gray-500 mt-1">{monthName}</div>
              <div className="text-xs mt-2 px-2 py-1 rounded-full bg-gray-100">
                {slotsCount} slot{slotsCount !== 1 ? 's' : ''}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MentorAvailabilityCalendar;