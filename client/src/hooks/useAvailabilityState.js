import { useState, useCallback } from 'react';
import { getUserTimezone, getNext7Days, formatDateForDisplay } from '../utils/timezoneUtils';

/**
 * Simplified hook for managing mentor availability state
 */
export const useAvailabilityState = () => {
  // Current availability data from backend (read-only)
  const [availabilityState, setAvailabilityState] = useState({
    weekly: {},     // { [dayOfWeek]: { slots: [hour], isActive: boolean } }
    specificDates: {}, // { [dateISO]: { slots: [hour] } }
    unavailability: []  // [{ from: dateString, to: dateString, reason?: string }]
  });

  // Current editing state for each date (temporary editing before save)
  const [editingState, setEditingState] = useState({});
  // { [dateString]: { slots: [hour], isWeeklyMode: boolean } }
  
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
    setEditingState(prev => {
      const current = prev[dateString] || { slots: [], isWeeklyMode: false };
      const newSlots = current.slots.includes(hour)
        ? current.slots.filter(h => h !== hour)
        : [...current.slots, hour].sort((a, b) => a - b);
      
      return {
        ...prev,
        [dateString]: {
          ...current,
          slots: newSlots
        }
      };
    });
  }, []);

  /**
   * Toggle weekly recurring mode for a specific date
   */
  const toggleWeeklyRecurring = useCallback((dateString, dayOfWeek) => {
    setEditingState(prev => {
      const current = prev[dateString] || { slots: [], isWeeklyMode: false };
      
      if (!current.isWeeklyMode) {
        // Switching to weekly mode - show weekly schedule for this day
        const weeklyData = availabilityState.weekly[dayOfWeek];
        const weeklySlots = weeklyData?.isActive ? (weeklyData.slots || []) : [];
        
        return {
          ...prev,
          [dateString]: {
            slots: [...weeklySlots],
            isWeeklyMode: true
          }
        };
      } else {
        // Switching to date-specific mode - show date-specific schedule
        const dateSpecific = availabilityState.specificDates[dateString];
        const dateSlots = dateSpecific?.slots || [];
        
        return {
          ...prev,
          [dateString]: {
            slots: [...dateSlots],
            isWeeklyMode: false
          }
        };
      }
    });
  }, [availabilityState]);

  /**
   * Get available slots for a specific date (for display)
   */
  const getAvailableSlots = useCallback((dateString, dayOfWeek) => {
    // Check if date is unavailable
    const date = new Date(dateString);
    const isUnavailable = availabilityState.unavailability.some(range => {
      const from = new Date(range.from);
      const to = new Date(range.to);
      return date >= from && date <= to;
    });
    
    if (isUnavailable) {
      return [];
    }

    // Check editing state first (user is currently editing this date)
    if (editingState[dateString]) {
      const editData = editingState[dateString];
      
      if (editData.isWeeklyMode) {
        // Show weekly slots while in weekly editing mode
        return editData.slots || [];
      } else {
        // Show date-specific slots while in date-specific editing mode
        return editData.slots || [];
      }
    }

    // No editing state - show saved data based on what exists
    // Priority: date-specific first, then weekly if active
    const dateSpecific = availabilityState.specificDates[dateString];
    if (dateSpecific) {
      return dateSpecific.slots || [];
    }

    // Check weekly recurring availability from saved state
    const weeklyData = availabilityState.weekly[dayOfWeek];
    if (weeklyData?.isActive) {
      return weeklyData.slots || [];
    }
    
    return [];
  }, [availabilityState, editingState]);

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
    // Check editing state first
    if (editingState[dateString]) {
      return editingState[dateString].isWeeklyMode;
    }

    // Check saved state - if date-specific exists, repeat is OFF
    if (availabilityState.specificDates[dateString]) {
      return false;
    }
    
    // If weekly availability exists and is active, repeat is ON
    const weeklyData = availabilityState.weekly[dayOfWeek];
    return weeklyData?.isActive || false;
  }, [availabilityState, editingState]);

  /**
   * Check if a date has any changes to save
   */
  const hasUnsavedChanges = useCallback((dateString) => {
    return editingState[dateString] !== undefined;
  }, [editingState]);

  /**
   * Save availability for a specific date
   */
  const saveAvailabilityForDate = useCallback(async (apiService, dateString) => {
    const editData = editingState[dateString];
    if (!editData) return { success: true };

    setLoading(true);
    try {
      const date = new Date(dateString);
      const dayOfWeek = date.getDay();

      if (editData.isWeeklyMode) {
        // Save as weekly recurring
        await apiService.setWeeklyAvailability(dayOfWeek, editData.slots, true);
      } else {
        // Save as date-specific
        await apiService.setDateAvailability(dateString, editData.slots);
      }

      // Clear editing state for this date
      setEditingState(prev => {
        const newState = { ...prev };
        delete newState[dateString];
        return newState;
      });

      // Reload availability data to show updated state
      await loadAvailability(apiService);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving availability:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [editingState]);

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
   * Load availability from API
   */
  const loadAvailability = useCallback(async (apiService) => {
    setLoading(true);
    try {
      const response = await apiService.getMyAvailability();
      
      if (response.success && response.data) {
        const { weekly, specificDates, unavailability } = response.data;
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
        // Clear editing state since we have fresh data
        setEditingState({});
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
    saveAvailabilityForDate,
    addUnavailabilityRange,
    removeUnavailabilityRange,
    
    // Getters
    isDateUnavailable,
    getAvailableSlots,
    isTimeSlotSelected,
    isRepeatEnabled,
    hasUnsavedChanges,
    
    // API methods
    loadAvailability
  };
};