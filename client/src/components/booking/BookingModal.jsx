import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';
import MentorAvailabilityCalendar from './MentorAvailabilityCalendar';
import TimeSlotGrid from './TimeSlotGrid';
import DurationSelector from './DurationSelector';
import BookingSummary from './BookingSummary';
import { useMentorAvailability } from '../../hooks/useMentorAvailability';
import { useCreateBooking } from '../../hooks/useCreateBooking';

/**
 * Main booking modal component that orchestrates the entire booking flow
 * Step 1: Date Selection
 * Step 2: Time Selection  
 * Step 3: Duration Selection
 * Step 4: Booking Summary & Confirmation
 */
const BookingModal = ({ isOpen, onClose, mentorId, mentorName, onBookingSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);

  // Fetch mentor availability
  const { availability, loading: availabilityLoading, error: availabilityError, timezone } = useMentorAvailability(mentorId);
  
  // Booking creation
  const { createBooking, loading: bookingLoading, error: bookingError, clearError } = useCreateBooking();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedDuration(null);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedDuration(null);
    setCurrentStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setSelectedDuration(null);
    setCurrentStep(3);
  };

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
    setCurrentStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot || !selectedDuration) {
      return;
    }

    // Format the startTime as ISO string (without timezone offset)
    const startTime = `${selectedDate}T${selectedSlot.start}`;

    const bookingData = {
      mentorId,
      startTime,
      duration: selectedDuration,
      currency: 'USD' // Default currency, could be made configurable
    };

    const result = await createBooking(bookingData);
    
    if (result.success) {
      if (onBookingSuccess) {
        onBookingSuccess(result.booking);
      }
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setSelectedSlot(null);
        setSelectedDuration(null);
      } else if (currentStep === 3) {
        setSelectedDuration(null);
      }
    }
  };

  // Get available slots for selected date
  const selectedDateSlots = selectedDate 
    ? availability.find(day => day.date === selectedDate)?.slots || []
    : [];

  // Get available durations for selected slot
  const availableDurations = selectedSlot?.durations || [];

  const stepTitles = {
    1: 'Select Date',
    2: 'Select Time',
    3: 'Select Duration',
    4: 'Confirm Booking'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Book Session</h2>
            <p className="text-gray-600">with {mentorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 rounded ${
                      step < currentStep ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-900">{stepTitles[currentStep]}</p>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <MentorAvailabilityCalendar
                  availability={availability}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  loading={availabilityLoading}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <TimeSlotGrid
                  slots={selectedDateSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                  loading={false}
                />
                <div className="px-6 pb-4">
                  <button
                    onClick={handleBack}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    ← Back to date selection
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DurationSelector
                  availableDurations={availableDurations}
                  selectedDuration={selectedDuration}
                  onDurationSelect={handleDurationSelect}
                  disabled={false}
                />
                <div className="px-6 pb-4">
                  <button
                    onClick={handleBack}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    ← Back to time selection
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <BookingSummary
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  selectedDuration={selectedDuration}
                  mentorName={mentorName}
                  timezone={timezone}
                  onConfirm={handleConfirmBooking}
                  onBack={handleBack}
                  loading={bookingLoading}
                  error={bookingError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Display for availability loading */}
        {availabilityError && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200">
            <p className="text-red-700 text-sm">{availabilityError}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BookingModal;