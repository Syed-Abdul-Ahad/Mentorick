import { useState } from 'react';
import { bookingService } from '../api';

/**
 * Hook for creating bookings
 * Uses the existing backend API: POST /api/booking/create
 */
export const useCreateBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);

      // Get user's timezone automatically
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Prepare booking data for the existing API
      const payload = {
        mentorId: bookingData.mentorId,
        startTime: bookingData.startTime, // Should be ISO string without timezone offset
        duration: bookingData.duration,
        timezone: timezone,
        currency: bookingData.currency || 'USD',
        description: bookingData.description || ''
      };

      // Call existing booking API
      const response = await bookingService.createBooking(payload);

      if (response?.success) {
        return {
          success: true,
          booking: response.booking,
          paymentRequired: response.paymentRequired !== false
        };
      } else {
        throw new Error('Booking creation failed');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create booking';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createBooking,
    loading,
    error,
    clearError: () => setError(null)
  };
};