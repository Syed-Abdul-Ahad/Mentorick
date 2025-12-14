import { useState, useCallback, useEffect } from 'react';
import { getUserTimezone, getNext7Days, formatDateForDisplay } from '../utils/timezoneUtils';

/**
 * Custom hook for managing mentor availability state
 */
export const useAvailabilityState = () => {
  const [selectedTimezone, setSelectedTimezone] = useState(getUserTimezone());
  const [availability, setAvailability] = useState({});
  const [weeklyRecurring, setWeeklyRecurring] = useState({});
  const [unavailabilityRanges, setUnavailabilityRanges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate the next 7 days
  const weekDays = getNext7Days().map(date => ({
    date,
    ...formatDateForDisplay(date)
  }));

  /**
   * Toggle a time slot for a specific date
   */
  const toggleTimeSlot = useCallback((dateString, hour) => {
    setAvailability(prev => {
      const current = prev[dateString] || { slots: [], repeat: false };
      const slots = current.slots.includes(hour)
        ? current.slots.filter(h => h !== hour)
        : [...current.slots, hour].sort((a, b) => a - b);
      
      return {
        ...prev,
        [dateString]: {
          ...current,
          slots
        }
      };
    });
  }, []);

  /**
   * Toggle weekly recurring for a specific day
   */
  const toggleWeeklyRecurring = useCallback((dateString, dayOfWeek) => {
    setAvailability(prev => {
      const current = prev[dateString] || { slots: [], repeat: false };
      const newRepeat = !current.repeat;
      
      // Update weekly recurring state
      setWeeklyRecurring(prevWeekly => ({
        ...prevWeekly,
        [dayOfWeek]: newRepeat ? (current.slots || []) : []
      }));
      
      return {
        ...prev,
        [dateString]: {
          ...current,
          repeat: newRepeat
        }
      };
    });
  }, []);

  /**
   * Add unavailability date range
   */
  const addUnavailabilityRange = useCallback((fromDate, toDate) => {
    const newRange = {
      id: Date.now(),
      from: fromDate,
      to: toDate
    };
    
    setUnavailabilityRanges(prev => [...prev, newRange]);
  }, []);

  /**
   * Remove unavailability range
   */
  const removeUnavailabilityRange = useCallback((rangeId) => {
    setUnavailabilityRanges(prev => prev.filter(range => range.id !== rangeId));
  }, []);

  /**
   * Check if a date is unavailable
   */
  const isDateUnavailable = useCallback((dateString) => {
    const date = new Date(dateString);
    return unavailabilityRanges.some(range => {
      const from = new Date(range.from);
      const to = new Date(range.to);
      return date >= from && date <= to;
    });
  }, [unavailabilityRanges]);

  /**
   * Get available slots for a specific date
   */
  const getAvailableSlots = useCallback((dateString, dayOfWeek) => {
    if (isDateUnavailable(dateString)) {
      return [];
    }

    // Check if there's date-specific availability
    const dateSpecific = availability[dateString];
    if (dateSpecific && !dateSpecific.repeat) {
      return dateSpecific.slots || [];
    }

    // Check weekly recurring availability
    const weeklySlots = weeklyRecurring[dayOfWeek] || [];
    const dateSlots = dateSpecific?.slots || [];
    
    // Merge weekly and date-specific slots
    const combinedSlots = [...new Set([...weeklySlots, ...dateSlots])];
    return combinedSlots.sort((a, b) => a - b);
  }, [availability, weeklyRecurring, isDateUnavailable]);

  /**
   * Check if a time slot is selected for a specific date
   */
  const isTimeSlotSelected = useCallback((dateString, hour, dayOfWeek) => {
    const availableSlots = getAvailableSlots(dateString, dayOfWeek);
    return availableSlots.includes(hour);
  }, [getAvailableSlots]);

  /**
   * Get repeat status for a specific date
   */
  const isRepeatEnabled = useCallback((dateString) => {
    const dateSpecific = availability[dateString];
    return dateSpecific?.repeat || false;
  }, [availability]);

  /**
   * Set AM/PM period for a day (helper for bulk operations)
   */
  const setDayPeriodSlots = useCallback((dateString, period, enabled) => {
    const startHour = period === 'AM' ? 0 : 12;
    const endHour = period === 'AM' ? 12 : 24;
    
    setAvailability(prev => {
      const current = prev[dateString] || { slots: [], repeat: false };
      
      if (enabled) {
        // Add all slots for this period
        const periodSlots = [];
        for (let hour = startHour; hour < endHour; hour++) {
          periodSlots.push(hour);
        }
        
        const otherPeriodSlots = current.slots.filter(hour => 
          period === 'AM' ? hour >= 12 : hour < 12
        );
        
        return {
          ...prev,
          [dateString]: {
            ...current,
            slots: [...otherPeriodSlots, ...periodSlots].sort((a, b) => a - b)
          }
        };
      } else {
        // Remove all slots for this period
        const remainingSlots = current.slots.filter(hour => 
          period === 'AM' ? hour >= 12 : hour < 12
        );
        
        return {
          ...prev,
          [dateString]: {
            ...current,
            slots: remainingSlots
          }
        };
      }
    });
  }, []);

  /**
   * Get current state for API submission
   */
  const getAvailabilityForAPI = useCallback(() => {
    const apiData = {
      timezone: selectedTimezone,
      weeklyRecurring: weeklyRecurring,
      dateSpecific: Object.keys(availability).reduce((acc, dateString) => {
        const dayData = availability[dateString];
        if (!dayData.repeat && dayData.slots.length > 0) {
          acc[dateString] = dayData.slots;
        }
        return acc;
      }, {}),
      unavailabilityRanges: unavailabilityRanges
    };
    
    return apiData;
  }, [selectedTimezone, availability, weeklyRecurring, unavailabilityRanges]);

  /**
   * Load availability from API response
   */
  const loadAvailabilityFromAPI = useCallback((apiData) => {
    if (!apiData) return;
    
    setSelectedTimezone(apiData.timezone || getUserTimezone());
    setWeeklyRecurring(apiData.weeklyRecurring || {});
    setUnavailabilityRanges(apiData.unavailabilityRanges || []);
    
    // Convert date-specific data to internal format
    const dateSpecificAvailability = {};
    if (apiData.dateSpecific) {
      Object.keys(apiData.dateSpecific).forEach(dateString => {
        dateSpecificAvailability[dateString] = {
          slots: apiData.dateSpecific[dateString],
          repeat: false
        };
      });
    }
    
    // Add weekly recurring data to availability
    if (apiData.weeklyRecurring) {
      weekDays.forEach(({ fullDate, date }) => {
        const dayOfWeek = date.getDay();
        const weeklySlots = apiData.weeklyRecurring[dayOfWeek];
        
        if (weeklySlots && weeklySlots.length > 0) {
          if (!dateSpecificAvailability[fullDate]) {
            dateSpecificAvailability[fullDate] = {
              slots: weeklySlots,
              repeat: true
            };
          }
        }
      });
    }
    
    setAvailability(dateSpecificAvailability);
  }, [weekDays]);

  /**
   * Save availability to API
   */
  const saveAvailability = useCallback(async (apiService) => {
    setLoading(true);
    try {
      const data = getAvailabilityForAPI();
      await apiService.saveAvailability(data);
      return { success: true };
    } catch (error) {
      console.error('Error saving availability:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [getAvailabilityForAPI]);

  /**
   * Load availability from API
   */
  const loadAvailability = useCallback(async (apiService) => {
    setLoading(true);
    try {
      const response = await apiService.getAvailability();
      loadAvailabilityFromAPI(response.data);
      return { success: true };
    } catch (error) {
      console.error('Error loading availability:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [loadAvailabilityFromAPI]);

  return {
    // State
    selectedTimezone,
    availability,
    weeklyRecurring,
    unavailabilityRanges,
    loading,
    weekDays,
    
    // Actions
    setSelectedTimezone,
    toggleTimeSlot,
    toggleWeeklyRecurring,
    addUnavailabilityRange,
    removeUnavailabilityRange,
    setDayPeriodSlots,
    
    // Getters
    isDateUnavailable,
    getAvailableSlots,
    isTimeSlotSelected,
    isRepeatEnabled,
    getAvailabilityForAPI,
    
    // API methods
    saveAvailability,
    loadAvailability,
    loadAvailabilityFromAPI
  };
};