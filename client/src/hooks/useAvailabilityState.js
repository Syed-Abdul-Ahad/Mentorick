import { useState, useCallback } from 'react';
import { getUserTimezone, getNext7Days, formatDateForDisplay } from '../utils/timezoneUtils';

/**
 * Custom hook for managing mentor availability state (Backend Compatible)
 * State structure matches backend MentorProfile model exactly
 */
export const useAvailabilityState = () => {
  // Backend-compatible state structure
  const [availabilityState, setAvailabilityState] = useState({
    weekly: {},     // { [dayOfWeek]: { slots: [hour], isActive: boolean } }
    specificDates: {}, // { [dateISO]: { slots: [hour] } }
    unavailability: []  // [{ from: dateString, to: dateString, reason?: string }]
  });

  // Track pending changes to send only incremental updates
  const [pendingChanges, setPendingChanges] = useState({
    weekly: {},     // { [dayOfWeek]: { slots: [hour], isActive: boolean } }
    specificDates: {}, // { [dateISO]: { slots: [hour] } }
    unavailability: []  // [{ from: dateString, to: dateString, reason?: string }]
  });
  
  const [selectedTimezone] = useState(getUserTimezone());
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
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    
    setAvailabilityState(prev => {
      // Check if we have date-specific availability for this date
      const hasDateSpecific = prev.specificDates[dateString];
      
      if (hasDateSpecific) {
        // Update date-specific availability
        const currentSlots = prev.specificDates[dateString].slots || [];
        const newSlots = currentSlots.includes(hour)
          ? currentSlots.filter(h => h !== hour)
          : [...currentSlots, hour].sort((a, b) => a - b);
        
        return {
          ...prev,
          specificDates: {
            ...prev.specificDates,
            [dateString]: { slots: newSlots }
          }
        };
      } else {
        // Check if we have weekly availability for this day
        const weeklyData = prev.weekly[dayOfWeek];
        
        if (weeklyData) {
          // Update weekly availability
          const currentSlots = weeklyData.slots || [];
          const newSlots = currentSlots.includes(hour)
            ? currentSlots.filter(h => h !== hour)
            : [...currentSlots, hour].sort((a, b) => a - b);
          
          return {
            ...prev,
            weekly: {
              ...prev.weekly,
              [dayOfWeek]: { ...weeklyData, slots: newSlots }
            }
          };
        } else {
          // Create new weekly availability
          return {
            ...prev,
            weekly: {
              ...prev.weekly,
              [dayOfWeek]: { slots: [hour], isActive: true }
            }
          };
        }
      }
    });

    // Track this change as pending
    setPendingChanges(prev => {
      const hasDateSpecific = availabilityState.specificDates[dateString];
      
      if (hasDateSpecific) {
        // Updating date-specific availability
        const currentSlots = availabilityState.specificDates[dateString].slots || [];
        const newSlots = currentSlots.includes(hour)
          ? currentSlots.filter(h => h !== hour)
          : [...currentSlots, hour].sort((a, b) => a - b);
        
        return {
          ...prev,
          specificDates: {
            ...prev.specificDates,
            [dateString]: { slots: newSlots }
          }
        };
      } else {
        // Updating weekly availability
        const weeklyData = availabilityState.weekly[dayOfWeek];
        const currentSlots = weeklyData?.slots || [];
        const newSlots = currentSlots.includes(hour)
          ? currentSlots.filter(h => h !== hour)
          : [...currentSlots, hour].sort((a, b) => a - b);
        
        return {
          ...prev,
          weekly: {
            ...prev.weekly,
            [dayOfWeek]: { slots: newSlots, isActive: true }
          }
        };
      }
    });
  }, [availabilityState]);

  /**
   * Toggle weekly recurring for a specific day
   */
  const toggleWeeklyRecurring = useCallback((dateString, dayOfWeek) => {
    setAvailabilityState(prev => {
      const weeklyData = prev.weekly[dayOfWeek];
      
      if (weeklyData?.isActive) {
        // Turn off weekly recurring - move to date-specific
        const currentSlots = weeklyData.slots || [];
        return {
          ...prev,
          weekly: {
            ...prev.weekly,
            [dayOfWeek]: { ...weeklyData, isActive: false }
          },
          specificDates: {
            ...prev.specificDates,
            [dateString]: { slots: [...currentSlots] }
          }
        };
      } else {
        // Turn on weekly recurring
        const dateSpecificSlots = prev.specificDates[dateString]?.slots || [];
        const newWeeklyData = { slots: [...dateSpecificSlots], isActive: true };
        
        // Remove date-specific entry
        const newSpecificDates = { ...prev.specificDates };
        delete newSpecificDates[dateString];
        
        return {
          ...prev,
          weekly: {
            ...prev.weekly,
            [dayOfWeek]: newWeeklyData
          },
          specificDates: newSpecificDates
        };
      }
    });

    // Track this change as pending
    setPendingChanges(prev => {
      const weeklyData = availabilityState.weekly[dayOfWeek];
      
      if (weeklyData?.isActive) {
        // Moving from weekly to date-specific
        return {
          ...prev,
          weekly: {
            ...prev.weekly,
            [dayOfWeek]: { ...weeklyData, isActive: false }
          },
          specificDates: {
            ...prev.specificDates,
            [dateString]: { slots: [...(weeklyData.slots || [])] }
          }
        };
      } else {
        // Moving from date-specific to weekly
        const dateSpecificSlots = availabilityState.specificDates[dateString]?.slots || [];
        return {
          ...prev,
          weekly: {
            ...prev.weekly,
            [dayOfWeek]: { slots: [...dateSpecificSlots], isActive: true }
          },
          specificDates: {
            ...prev.specificDates,
            [dateString]: { slots: [] } // Clear date-specific
          }
        };
      }
    });
  }, [availabilityState]);

  /**
   * Add unavailability date range
   */
  const addUnavailabilityRange = useCallback((fromDate, toDate, reason = '') => {
    const newRange = {
      from: fromDate,
      to: toDate,
      reason
    };
    
    setAvailabilityState(prev => ({
      ...prev,
      unavailability: [...prev.unavailability, newRange]
    }));
  }, []);

  /**
   * Remove unavailability range
   */
  const removeUnavailabilityRange = useCallback((rangeIndex) => {
    setAvailabilityState(prev => ({
      ...prev,
      unavailability: prev.unavailability.filter((_, index) => index !== rangeIndex)
    }));
  }, []);

  /**
   * Check if a date is unavailable
   */
  const isDateUnavailable = useCallback((dateString) => {
    const date = new Date(dateString);
    return availabilityState.unavailability.some(range => {
      const from = new Date(range.from);
      const to = new Date(range.to);
      return date >= from && date <= to;
    });
  }, [availabilityState.unavailability]);

  /**
   * Get available slots for a specific date
   */
  const getAvailableSlots = useCallback((dateString, dayOfWeek) => {
    if (isDateUnavailable(dateString)) {
      return [];
    }

    // Check if there's date-specific availability first
    const dateSpecific = availabilityState.specificDates[dateString];
    if (dateSpecific) {
      return dateSpecific.slots || [];
    }

    // Check weekly recurring availability
    const weeklyData = availabilityState.weekly[dayOfWeek];
    if (weeklyData?.isActive) {
      return weeklyData.slots || [];
    }
    
    return [];
  }, [availabilityState, isDateUnavailable]);

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
  const isRepeatEnabled = useCallback((dateString, dayOfWeek) => {
    // If date-specific availability exists, repeat is OFF
    if (availabilityState.specificDates[dateString]) {
      return false;
    }
    
    // If weekly availability exists and is active, repeat is ON
    const weeklyData = availabilityState.weekly[dayOfWeek];
    return weeklyData?.isActive || false;
  }, [availabilityState]);

  /**
   * Save availability using backend APIs - only send pending changes
   */
  const saveAvailability = useCallback(async (apiService) => {
    setLoading(true);
    try {
      const savePromises = [];
      
      // Save only pending weekly changes
      Object.keys(pendingChanges.weekly).forEach(dayOfWeek => {
        const weeklyData = pendingChanges.weekly[dayOfWeek];
        savePromises.push(
          apiService.setWeeklyAvailability(parseInt(dayOfWeek), weeklyData.slots)
        );
      });
      
      // Save only pending date-specific changes
      Object.keys(pendingChanges.specificDates).forEach(dateString => {
        const dateData = pendingChanges.specificDates[dateString];
        savePromises.push(
          apiService.setDateAvailability(dateString, dateData.slots)
        );
      });
      
      // Save pending unavailability ranges (if any)
      if (pendingChanges.unavailability.length > 0) {
        pendingChanges.unavailability.forEach(range => {
          savePromises.push(
            apiService.setUnavailability(range.from, range.to, range.reason)
          );
        });
      }
      
      // Only make API calls if there are pending changes
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }
      
      // Clear pending changes after successful save
      setPendingChanges({
        weekly: {},
        specificDates: {},
        unavailability: []
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving availability:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [pendingChanges]);

  /**
   * Load availability from API
   */
  const loadAvailability = useCallback(async (apiService) => {
    setLoading(true);
    try {
      const response = await apiService.getMyAvailability();
      
      if (response.success && response.data) {
        const { weekly, specificDates, unavailability } = response.data;
        
        // Convert backend data to frontend state format
        const newState = {
          weekly: {},
          specificDates: {},
          unavailability: unavailability || []
        };

        // Convert weekly availability
        if (weekly && weekly.length > 0) {
          weekly.forEach(weekData => {
            newState.weekly[weekData.dayOfWeek] = {
              slots: weekData.slots.map(slotObj => slotObj.hour),
              isActive: weekData.isActive
            };
          });
        }

        // Convert specific dates
        if (specificDates && specificDates.length > 0) {
          specificDates.forEach(dateData => {
            const dateString = new Date(dateData.date).toISOString().split('T')[0];
            newState.specificDates[dateString] = {
              slots: dateData.slots.map(slotObj => slotObj.hour)
            };
          });
        }

        setAvailabilityState(newState);
        // Clear any pending changes since we just loaded fresh data
        setPendingChanges({
          weekly: {},
          specificDates: {},
          unavailability: []
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error loading availability:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    selectedTimezone,
    availabilityState,
    loading,
    weekDays,
    
    // Actions
    toggleTimeSlot,
    toggleWeeklyRecurring,
    addUnavailabilityRange,
    removeUnavailabilityRange,
    
    // Getters
    isDateUnavailable,
    getAvailableSlots,
    isTimeSlotSelected,
    isRepeatEnabled,
    
    // API methods
    saveAvailability,
    loadAvailability
  };
};