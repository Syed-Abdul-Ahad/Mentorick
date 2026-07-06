import { useState, useEffect } from 'react';
import { useAvailabilityState } from '../../hooks/useAvailabilityState';
import { availabilityService } from '../../api';
import DayAvailabilityCard from './DayAvailabilityCard';
import UnavailabilityModal from './UnavailabilityModal';
import Toast from '../shared/Toast';
import toast from 'react-hot-toast';
import axios from 'axios';


const AvailabilityPage = () => {
  const {
    // State
    selectedTimezone,
    weekDays,
    availabilityState,
    loading,
    
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
  } = useAvailabilityState();

  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const[loading2, setLoading] = useState(false); // dont remove this
  const [conflictModal, setConflictModal] = useState({ show: false, bookings: [], message: '' });

  // Load availability on component mount
  useEffect(() => {
    loadInitialAvailability();
  }, []);

  useEffect(() => {
  axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/google/status`, {
    withCredentials: true
  }).then(res => {
    setGoogleConnected(res.data.connected);
  });
}, []);


  const loadInitialAvailability = async () => {
    try {
      const result = await loadAvailability(availabilityService);
      if (result.success) {
        setInitialized(true);
        toast.success('Availability loaded successfully');
      } else {
        toast.error('Failed to load availability');
        setInitialized(true); // Still show the interface
      }
    } catch (error) {
      console.error('Error loading initial availability:', error);
      toast.error('Failed to load availability');
      setInitialized(true); // Still show the interface
    }
  };

const params = new URLSearchParams(location.search);
const connected = params.get('connected');

if (connected === 'true') {
  console.log('Google Calendar connected');
}

  const handleTimezoneChange = (timezone) => {
    // Timezone is now read-only in this implementation
    // Backend determines timezone handling
    toast.success('Timezone display updated');
  };

  const handleToggleSlot = (dateString, hour) => {
    toggleTimeSlot(dateString, hour);
    // No auto-save, only manual save
  };

  const handleToggleRepeat = (dateString, dayOfWeek) => {
    toggleWeeklyRecurring(dateString, dayOfWeek);
    // No auto-save, only manual save
  };

  const handleOpenUnavailabilityModal = () => {
    setShowUnavailabilityModal(true);
  };

  const handleCloseUnavailabilityModal = () => {
    setShowUnavailabilityModal(false);
  };

  const handleSubmitUnavailability = async (fromDate, toDate, rangeIndex, action) => {
    try {
      if (action === 'remove') {
        removeUnavailabilityRange(rangeIndex);
        toast.success('Unavailability period removed');
      } else if (fromDate && toDate) {
        try {
          // Call API to set unavailability
          await availabilityService.setUnavailability(fromDate, toDate);
          addUnavailabilityRange(fromDate, toDate);
          toast.success('Unavailability period set successfully');
          setShowUnavailabilityModal(false);
        } catch (apiError) {
          // Handle specific 409 conflict error
          if (apiError.response?.status === 409) {
            const errorData = apiError.response.data;
            const conflictingBookings = errorData.conflictingBookings || [];
            
            // Show conflict modal instead of just toast
            setConflictModal({
              show: true,
              bookings: conflictingBookings,
              message: errorData.message,
              suggestion: errorData.suggestion
            });
            
            // Also show toast for immediate feedback
            toast.error('Cannot set unavailability - you have existing bookings in this period');
          } else {
            throw apiError; // Re-throw for generic error handling
          }
        }
      }
    } catch (error) {
      console.error('Error handling unavailability:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update unavailability';
      toast.error(errorMessage);
    }
  };



  const handleManualSave = async (dateString = null) => {
    setLoading(true);
    if(!googleConnected){
      toast.error('Please connect your Google Calendar before saving availability');
      setLoading(false);
      return;
    }
    try {
      if (dateString) {
        // Save specific date
        const result = await saveAvailabilityForDate(availabilityService, dateString);
        if (result.success) {
          toast.success('Availability saved successfully');
        } else {
          toast.error(result.error || 'Failed to save availability');
        }
      } else {
        // Save all dates with unsaved changes
        const datesToSave = weekDays.filter(day => hasUnsavedChanges(day.fullDate));
        
        if (datesToSave.length === 0) {
          toast('No changes to save', { icon: 'ℹ️' });
          return;
        }

        for (const dayData of datesToSave) {
          const result = await saveAvailabilityForDate(availabilityService, dayData.fullDate);
          if (!result.success) {
            throw new Error(result.error || `Failed to save ${dayData.dayName}`);
          }
        }
        
        toast.success(`Saved availability for ${datesToSave.length} day(s)`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Timezone */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Set Your Availability
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-lg text-gray-600">{selectedTimezone} Standard Time</span>
              {/* Google Calendar Status Badge */}
              <div className="flex items-center">
                {googleConnected ? (
                  <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Google Calendar Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      window.location.href = 'http://localhost:5000/auth/google';
                    }}
                    className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Connect Google Calendar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unavailability Button */}
          <button
            onClick={handleOpenUnavailabilityModal}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-opacity-50"
          >
            Set your Unavailability Date
          </button>
        </div>
      </div>

      {/* Loading indicator for initial load */}
      {!initialized && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
          <span className="text-gray-600">Loading your availability...</span>
        </div>
      )}

      {/* Loading indicator for saving */}
      {loading && (
        <div className="mb-4 flex items-center text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
          <span>Saving...</span>
        </div>
      )}

      {/* Weekly Calendar Grid */}
      {initialized && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {weekDays.map((dayData) => {
          const dayOfWeek = dayData.date.getDay();
          const selectedSlots = getAvailableSlots(dayData.fullDate, dayOfWeek);
          const isRepeat = isRepeatEnabled(dayData.fullDate, dayOfWeek);
          const isUnavailable = isDateUnavailable(dayData.fullDate);
          const hasChanges = hasUnsavedChanges(dayData.fullDate);

          return (
            <DayAvailabilityCard
              key={dayData.fullDate}
              dayData={dayData}
              selectedSlots={selectedSlots}
              isRepeatEnabled={isRepeat}
              isUnavailable={isUnavailable}
              hasUnsavedChanges={hasChanges}
              onToggleSlot={handleToggleSlot}
              onToggleRepeat={handleToggleRepeat}
              onSave={handleManualSave}
            />
          );
        })}
      </div>
      )}

      {/* Summary Section */}
      {initialized && (
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Availability Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weekDays.map((dayData) => {
            const dayOfWeek = dayData.date.getDay();
            const selectedSlots = getAvailableSlots(dayData.fullDate, dayOfWeek);
            const isUnavailable = isDateUnavailable(dayData.fullDate);
            
            return (
              <div key={dayData.fullDate} className="text-center">
                <div className={`font-medium ${
                  isUnavailable ? 'text-red-500' : selectedSlots.length > 0 ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {dayData.dayName}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {isUnavailable 
                    ? 'Unavailable' 
                    : selectedSlots.length > 0 
                      ? `${selectedSlots.length} slots` 
                      : 'No availability'
                  }
                </div>
              </div>
            );
          })}
        </div>
        
        {availabilityState.unavailability.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">
              Unavailable Periods
            </h4>
            <div className="space-y-1">
              {availabilityState.unavailability.map((range, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {new Date(range.from).toLocaleDateString()} - {new Date(range.to).toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Booking Conflict Modal */}
      {conflictModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Cannot Set Unavailability
            </h3>
            <p className="text-gray-700 mb-4">{conflictModal.message}</p>
            
            {conflictModal.bookings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Conflicting Bookings:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {conflictModal.bookings.map((booking, index) => (
                    <div key={booking.id} className="bg-gray-50 p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{booking.mentee}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.startTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Duration: {booking.duration} minutes | Status: {booking.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-6">
              {conflictModal.suggestion || 'Please cancel or reschedule these bookings before setting unavailability.'}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConflictModal({ show: false, bookings: [], message: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setConflictModal({ show: false, bookings: [], message: '' });
                  // Navigate to bookings page to manage conflicts
                  window.location.href = '/my-bookings';
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unavailability Modal */}
      <UnavailabilityModal
        isOpen={showUnavailabilityModal}
        onClose={handleCloseUnavailabilityModal}
        onSubmit={handleSubmitUnavailability}
        existingRanges={availabilityState.unavailability}
      />

      {/* React Hot Toast Container */}
      <Toast />
    </div>
  );
};

export default AvailabilityPage;