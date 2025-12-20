import { useState, useEffect, useCallback } from 'react';
import { availabilityService } from '../api';

/**
 * Hook for fetching mentor availability data
 * Uses the existing backend API: GET /api/mentor/availability/:mentorId
 */
export const useMentorAvailability = (mentorId) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user's timezone automatically
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fetchAvailability = useCallback(async () => {
    if (!mentorId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Call existing API with timezone parameter
      const response = await availabilityService.getMentorAvailability(mentorId, userTimezone);
      
      // Transform the response to match the expected format
      // Backend returns: { success: true, availability: [...] }
      if (response?.success && response?.availability) {
        setAvailability(response.availability);
      } else {
        setAvailability([]);
      }
    } catch (err) {
      console.error('Error fetching mentor availability:', err);
      setError(err.message || 'Failed to load availability');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [mentorId, userTimezone]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    loading,
    error,
    refetch: fetchAvailability,
    timezone: userTimezone
  };
};