import { useState, useEffect } from 'react';
import { useAvailabilityState } from '../../hooks/useAvailabilityState';
import { availabilityService } from '../../api';
import AvailabilityHeader from './AvailabilityHeader';
import DayAvailabilityCard from './DayAvailabilityCard';
import UnavailabilityModal from './UnavailabilityModal';
import Toast from '../shared/Toast';

const AvailabilityPage = () => {
  const {
    // State
    selectedTimezone,
    weekDays,
    unavailabilityRanges,
    loading,
    
    // Actions
    setSelectedTimezone,
    toggleTimeSlot,
    toggleWeeklyRecurring,
    addUnavailabilityRange,
    removeUnavailabilityRange,
    
    // Getters
    isDateUnavailable,
    getAvailableSlots,
    isRepeatEnabled,
    getAvailabilityForAPI,
    
    // API methods
    saveAvailability,
    loadAvailability
  } = useAvailabilityState();

  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [autoSaving, setAutoSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load availability on component mount
  useEffect(() => {
    loadInitialAvailability();
  }, []);

  const loadInitialAvailability = async () => {
    try {
      const result = await loadAvailability(availabilityService);
      if (result.success) {
        setInitialized(true);
      } else {
        showToast('Failed to load availability', 'error');
      }
    } catch (error) {
      console.error('Error loading initial availability:', error);
      showToast('Failed to load availability', 'error');
      setInitialized(true); // Still show the interface
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [selectedTimezone, weekDays]); // Dependencies that trigger auto-save

  const handleAutoSave = async () => {
    if (loading || !initialized) return;
    
    setAutoSaving(true);
    try {
      const result = await saveAvailability(availabilityService);
      if (!result.success) {
        console.error('Auto-save failed:', result.error);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
    showToast('Timezone updated successfully');
  };

  const handleToggleSlot = (dateString, hour) => {
    toggleTimeSlot(dateString, hour);
  };

  const handleToggleRepeat = (dateString, dayOfWeek) => {
    toggleWeeklyRecurring(dateString, dayOfWeek);
    showToast('Repeat setting updated');
  };

  const handleOpenUnavailabilityModal = () => {
    setShowUnavailabilityModal(true);
  };

  const handleCloseUnavailabilityModal = () => {
    setShowUnavailabilityModal(false);
  };

  const handleSubmitUnavailability = async (fromDate, toDate, rangeId, action) => {
    try {
      if (action === 'remove') {
        removeUnavailabilityRange(rangeId);
        // Call API to remove unavailability
        await availabilityService.removeUnavailabilityPeriod(rangeId);
        showToast('Unavailability period removed');
      } else if (fromDate && toDate) {
        addUnavailabilityRange(fromDate, toDate);
        // Call API to set unavailability
        await availabilityService.setUnavailabilityPeriod(fromDate, toDate);
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

  const handleManualSave = async () => {
    setAutoSaving(true);
    try {
      const result = await saveAvailability(availabilityService);
      if (result.success) {
        showToast('Availability saved successfully');
      } else {
        showToast(result.error || 'Failed to save availability', 'error');
      }
    } catch (error) {
      console.error('Manual save failed:', error);
      showToast('Failed to save availability', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <AvailabilityHeader
        selectedTimezone={selectedTimezone}
        onTimezoneChange={handleTimezoneChange}
        onOpenUnavailabilityModal={handleOpenUnavailabilityModal}
      />

      {/* Auto-save indicator */}
      {(autoSaving || loading) && (
        <div className="mb-4 flex items-center text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
          <span>{autoSaving ? 'Auto-saving...' : 'Loading...'}</span>
        </div>
      )}

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {weekDays.map((dayData) => {
          const dayOfWeek = dayData.date.getDay();
          const selectedSlots = getAvailableSlots(dayData.fullDate, dayOfWeek);
          const isRepeat = isRepeatEnabled(dayData.fullDate);
          const isUnavailable = isDateUnavailable(dayData.fullDate);

          return (
            <DayAvailabilityCard
              key={dayData.fullDate}
              dayData={dayData}
              selectedSlots={selectedSlots}
              isRepeatEnabled={isRepeat}
              isUnavailable={isUnavailable}
              onToggleSlot={handleToggleSlot}
              onToggleRepeat={handleToggleRepeat}
            />
          );
        })}
      </div>

      {/* Manual Save Button (for testing/backup) */}
      <div className="flex justify-center">
        <button
          onClick={handleManualSave}
          disabled={autoSaving || loading}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {autoSaving ? 'Saving...' : 'Manual Save'}
        </button>
      </div>

      {/* Summary Section */}
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
        
        {unavailabilityRanges.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">
              Unavailable Periods
            </h4>
            <div className="space-y-1">
              {unavailabilityRanges.map(range => (
                <div key={range.id} className="text-sm text-gray-600">
                  {new Date(range.from).toLocaleDateString()} - {new Date(range.to).toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unavailability Modal */}
      <UnavailabilityModal
        isOpen={showUnavailabilityModal}
        onClose={handleCloseUnavailabilityModal}
        onSubmit={handleSubmitUnavailability}
        existingRanges={unavailabilityRanges}
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