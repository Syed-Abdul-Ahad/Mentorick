import React from 'react';
import { motion } from 'framer-motion';
import Button from '../shared/Button';
import { formatTimeTo12Hour } from '../../utils/timezone';

/**
 * Booking summary component for booking flow
 * Shows final booking details before confirmation
 */
const BookingSummary = ({ 
  selectedDate, 
  selectedSlot, 
  selectedDuration, 
  mentorName, 
  timezone,
  description, 
  onConfirm, 
  onBack, 
  loading,
  error 
}) => {
  if (!selectedDate || !selectedSlot || !selectedDuration) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please complete your selection</p>
      </div>
    );
  }

  // Format the date for display
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Summary</h3>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Mentor</span>
          <span className="font-medium text-gray-900">{mentorName}</span>
        </div>
        
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Date</span>
          <span className="font-medium text-gray-900">{formattedDate}</span>
        </div>
        
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Time</span>
          <span className="font-medium text-gray-900">{formatTimeTo12Hour(selectedSlot.start)}</span>
        </div>
        
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium text-gray-900">{selectedDuration} minutes</span>
        </div>
        
        <div className="flex justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Timezone</span>
          <span className="font-medium text-gray-900">{timezone}</span>
        </div>
        
        {description && (
          <div className="py-3 border-b border-gray-100">
            <span className="text-gray-600 block mb-2">Session Agenda</span>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-900">{description}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Booking...
            </div>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;