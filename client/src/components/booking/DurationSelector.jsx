import React from 'react';
import { motion } from 'framer-motion';

/**
 * Duration selector component for booking flow
 * Shows available durations for selected time slot
 */
const DurationSelector = ({ availableDurations, selectedDuration, onDurationSelect, disabled }) => {
  if (!availableDurations || availableDurations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please select a time slot first</p>
      </div>
    );
  }

  const durationInfo = {
    15: { label: '15 min', description: 'Quick consultation' },
    30: { label: '30 min', description: 'Standard session' },
    60: { label: '60 min', description: 'Deep dive session' }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Duration</h3>
      <div className="space-y-3">
        {availableDurations.map((duration) => {
          const isSelected = selectedDuration === duration;
          const info = durationInfo[duration] || { label: `${duration} min`, description: 'Session' };
          
          return (
            <motion.button
              key={duration}
              onClick={() => onDurationSelect(duration)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={disabled}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                    {info.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {info.description}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DurationSelector;