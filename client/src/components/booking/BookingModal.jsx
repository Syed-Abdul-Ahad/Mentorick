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
 * Main booking modal — date/time/duration → bank transfer payment
 */
const BookingModal = ({ isOpen, onClose, mentorId, mentorName, onBookingSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [description, setDescription] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const { availability, loading: availabilityLoading, error: availabilityError, timezone } = useMentorAvailability(mentorId);
  const { createBooking, loading: bookingLoading, error: bookingError, clearError } = useCreateBooking();

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedDuration(null);
      setDescription('');
      setPaymentError('');
      clearError();
    }
  }, [isOpen, clearError]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedDuration(null);
    setPaymentError('');
    setCurrentStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setSelectedDuration(null);
    setPaymentError('');
    setCurrentStep(3);
  };

  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
    setPaymentError('');
    setCurrentStep(4);
  };

  const handleDescriptionNext = () => {
    setPaymentError('');
    setCurrentStep(5);
  };

  const handleReserveBooking = async () => {
    if (!selectedDate || !selectedSlot || !selectedDuration) {
      throw new Error('Please complete your booking selection first');
    }

    const startTime = `${selectedDate}T${selectedSlot.start}`;
    const bookingResult = await createBooking({
      mentorId,
      startTime,
      duration: selectedDuration,
      currency: 'USD',
      description: description.trim(),
    });

    if (!bookingResult.success) {
      setPaymentError(bookingResult.error || 'Failed to create booking');
      throw new Error(bookingResult.error || 'Failed to create booking');
    }

    return {
      booking: bookingResult.booking,
      bankDetails: bookingResult.bankDetails,
    };
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setPaymentError('');
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setSelectedSlot(null);
        setSelectedDuration(null);
      } else if (currentStep === 3) {
        setSelectedDuration(null);
      }
    }
  };

  const selectedDateSlots = selectedDate
    ? availability.find((day) => day.date === selectedDate)?.slots || []
    : [];

  const availableDurations = selectedSlot?.durations || [];

  const stepTitles = {
    1: 'Select Date',
    2: 'Select Time',
    3: 'Select Duration',
    4: 'Add Description',
    5: 'Pay by bank transfer',
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Book Session</h2>
            <p className="text-gray-600">with {mentorName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
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
                {step < 5 && (
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
                  selectedDate={selectedDate}
                  loading={false}
                />
                <div className="px-6 pb-4">
                  <button
                    type="button"
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
                    type="button"
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
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What would you like to discuss? <span className="text-gray-400">(Optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
                        placeholder="In which topic area you want to discuss and what would be the agenda of the meeting?"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={6}
                        maxLength={1500}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500">
                          This helps your mentor prepare for the session
                        </p>
                        <span className="text-sm text-gray-400">
                          {description.length}/1500
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleDescriptionNext}
                      className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Continue to Summary
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
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
                  description={description}
                  onReserveBooking={handleReserveBooking}
                  onLeaveToPayment={(booking) => {
                    setPaymentError('');
                    if (onBookingSuccess) onBookingSuccess(booking);
                    onClose();
                  }}
                  onBack={handleBack}
                  loading={bookingLoading}
                  error={paymentError || bookingError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
