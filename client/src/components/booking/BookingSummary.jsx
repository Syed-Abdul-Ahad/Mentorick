import React from 'react';
import Button from '../shared/Button';
import PayPalCheckout from '../shared/PayPalCheckout';
import { formatTimeTo12Hour } from '../../utils/timezone';
import { formatDurationLabel } from '../../utils/durationDisplay';

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
  onCreateOrder,
  onCaptureOrder,
  onPaymentSuccess,
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <PayPalCheckout
          onCreateOrder={onCreateOrder}
          onApprove={async (data) => {
            const result = await onCaptureOrder(data.orderID);
            if (onPaymentSuccess) {
              onPaymentSuccess(result.booking);
            }
          }}
          onError={() => {}}
          helperText="Pay securely with PayPal to confirm this booking."
        />

        <Button
          variant="secondary"
          onClick={onBack}
          disabled={loading}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;