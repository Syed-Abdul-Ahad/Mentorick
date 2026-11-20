import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../shared/Button';
import { formatTimeTo12Hour } from '../../utils/timezone';
import { formatDurationLabel } from '../../utils/durationDisplay';

/**
 * Booking summary step — confirms selection, then opens dedicated payment page.
 */
const BookingSummary = ({
  selectedDate,
  selectedSlot,
  selectedDuration,
  mentorName,
  timezone,
  description,
  onReserveBooking,
  onLeaveToPayment,
  onBack,
  loading,
  error,
}) => {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');
  const [reserving, setReserving] = useState(false);

  if (!selectedDate || !selectedSlot || !selectedDuration) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please complete your selection</p>
      </div>
    );
  }

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleConfirmBooking = async () => {
    try {
      setLocalError('');
      setReserving(true);
      const result = await onReserveBooking();
      if (!result?.booking) {
        throw new Error(result?.error || 'Failed to create booking');
      }

      const bookingId = String(result.booking._id || result.booking.id || '');
      if (!bookingId || bookingId === 'undefined') {
        throw new Error('Booking created but missing id');
      }

      // Navigate BEFORE closing the modal — closing unmounts this component
      // and can cancel navigation (shows NotFound until hard refresh).
      navigate(`/booking/payment/${bookingId}`, {
        replace: false,
        state: {
          booking: result.booking,
          bankDetails: result.bankDetails || null,
        },
      });
      onLeaveToPayment?.(result.booking);
    } catch (err) {
      setLocalError(err.message || 'Failed to create booking');
    } finally {
      setReserving(false);
    }
  };

  const displayError = localError || error;

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
          <span className="font-medium text-gray-900">{formatDurationLabel(selectedDuration)}</span>
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

      {displayError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{displayError}</p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Confirm to reserve this slot for 30 minutes while you transfer payment and upload a screenshot.
        </p>
        <Button onClick={handleConfirmBooking} disabled={loading || reserving} className="w-full">
          {loading || reserving ? 'Reserving…' : 'Confirm & continue to payment'}
        </Button>
        <Button variant="secondary" onClick={onBack} disabled={loading || reserving} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;
