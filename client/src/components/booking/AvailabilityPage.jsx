import { useState, useEffect } from 'react';
import { useAvailabilityState } from '../../hooks/useAvailabilityState';
import { availabilityService } from '../../api';
import DayAvailabilityCard from './DayAvailabilityCard';
import UnavailabilityModal from './UnavailabilityModal';
import Toast from '../shared/Toast';
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [initialized, setInitialized] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const[loading2, setLoading] = useState(false); // dont remove this

  // Load availability on component mount
  useEffect(() => {
    loadInitialAvailability();
  }, []);

  useEffect(() => {
  axios.get('http://localhost:5000/auth/google/status', {
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
        showToast('Availability loaded successfully');
      } else {
        showToast('Failed to load availability', 'error');
        setInitialized(true); // Still show the interface
      }
    } catch (error) {
      console.error('Error loading initial availability:', error);
      showToast('Failed to load availability', 'error');
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
    showToast('Timezone display updated');
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
        showToast('Unavailability period removed');
      } else if (fromDate && toDate) {
        addUnavailabilityRange(fromDate, toDate);
        // Call API to set unavailability
        await availabilityService.setUnavailability(fromDate, toDate);
        showToast('Unavailability period set successfully');
      }
    } catch (error) {
      console.error('Error handling unavailability:', error);
      showToast('Failed to update unavailability', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleManualSave = async (dateString = null) => {
    console.log("Save button clicked for date:", dateString);
    setLoading(true);
    try {
      if (dateString) {
        // Save specific date
        const result = await saveAvailabilityForDate(availabilityService, dateString);
        if (result.success) {
          showToast('Availability saved successfully');
        } else {
          showToast(result.error || 'Failed to save availability', 'error');
        }
      } else {
        // Save all dates with unsaved changes
        const datesToSave = weekDays.filter(day => hasUnsavedChanges(day.fullDate));
        
        if (datesToSave.length === 0) {
          showToast('No changes to save', 'info');
          return;
        }

        for (const dayData of datesToSave) {
          const result = await saveAvailabilityForDate(availabilityService, dayData.fullDate);
          if (!result.success) {
            throw new Error(result.error || `Failed to save ${dayData.dayName}`);
          }
        }
        
        showToast(`Saved availability for ${datesToSave.length} day(s)`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Failed to save availability', 'error');
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
            <span className="text-lg text-gray-600">{selectedTimezone} Standard Time</span>
          </div>

      {googleConnected ? (
        <button disabled className="connected-btn">
          ✅ Google Calendar Connected
        </button>
      ) : (
        <button
          onClick={() => {
            window.location.href = 'http://localhost:5000/auth/google';
          }}
        >
          Connect Google Calendar
        </button>
      )}

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

      {/* Manual Save Button */}
      {initialized && (
      <div className="flex justify-center mb-8">
        <button
          onClick={handleManualSave}
          disabled={loading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Availability'
          )}
        </button>
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

      {/* Unavailability Modal */}
      <UnavailabilityModal
        isOpen={showUnavailabilityModal}
        onClose={handleCloseUnavailabilityModal}
        onSubmit={handleSubmitUnavailability}
        existingRanges={availabilityState.unavailability}
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default AvailabilityPage;