import React from 'react';
import { motion } from 'framer-motion';
import { formatTimeTo12Hour } from '../../utils/timezone';

/**
 * Time slot grid component for booking flow
 * Shows available time slots for selected date
 */
const TimeSlotGrid = ({ slots, selectedSlot, onSlotSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading time slots...</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.start === slot.start;
          const maxDuration = Math.max(...slot.durations);
          
          return (
            <motion.button
              key={slot.start}
              onClick={() => onSlotSelect(slot)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-bold text-lg">{formatTimeTo12Hour(slot.start)}</div>
              <div className="text-xs text-gray-500 mt-2">
                Up to {maxDuration} min
              </div>
              <div className="text-xs mt-1">
                {slot.durations.join(', ')} min
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotGrid;