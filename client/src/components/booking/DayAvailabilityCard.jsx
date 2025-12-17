import { useState } from 'react';
import { generateTimeSlots, isToday, hourToLabel } from '../../utils/timezoneUtils';

const DayAvailabilityCard = ({
  dayData,
  selectedSlots = [],
  isRepeatEnabled = false,
  isUnavailable = false,
  onToggleSlot,
  onToggleRepeat
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  
  const { dayName, dateString, fullDate } = dayData;
  const dayOfWeek = dayData.date.getDay();
  
  // Generate slots for current period
  const timeSlots = generateTimeSlots(selectedPeriod);
  
  // Check if current period has any selected slots
  const hasAMSlots = selectedSlots.some(hour => hour < 12);
  const hasPMSlots = selectedSlots.some(hour => hour >= 12);
  
  const isCurrentPeriodActive = selectedPeriod === 'AM' ? hasAMSlots : hasPMSlots;

  const handleSlotClick = (hour) => {
    if (isUnavailable) return;
    onToggleSlot(fullDate, hour);
  };

  const handleRepeatToggle = () => {
    if (isUnavailable) return;
    
    onToggleRepeat(fullDate, dayOfWeek);
  };

  return (
    <div className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
      isUnavailable 
        ? 'border-gray-200 bg-gray-50 opacity-60' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Day Header */}
      <div className="mb-4">
        <h3 className={`font-semibold text-lg ${
          isToday(dayData.date) 
            ? 'text-primary-600' 
            : isUnavailable 
              ? 'text-gray-400' 
              : 'text-gray-900'
        }`}>
          {dayName}
        </h3>
        <p className={`text-sm ${
          isUnavailable ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {dateString}
        </p>
        {isUnavailable && (
          <div className="mt-1">
            <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* AM/PM Toggle */}
      <div className="mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedPeriod('AM')}
            disabled={isUnavailable}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
              selectedPeriod === 'AM'
                ? 'bg-primary-500 text-white shadow-sm'
                : isUnavailable
                  ? 'text-gray-400'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AM
          </button>
          <button
            onClick={() => setSelectedPeriod('PM')}
            disabled={isUnavailable}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
              selectedPeriod === 'PM'
                ? 'bg-primary-500 text-white shadow-sm'
                : isUnavailable
                  ? 'text-gray-400'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map(slot => {
            const isSelected = selectedSlots.includes(slot.value);
            
            return (
              <button
                key={slot.value}
                onClick={() => handleSlotClick(slot.value)}
                disabled={isUnavailable}
                className={`py-2 px-3 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-opacity-50 ${
                  isSelected
                    ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
                    : isUnavailable
                      ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-300'
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Repeat Toggle */}
      <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${
          isUnavailable ? 'text-gray-400' : 'text-gray-700'
        }`}>
          Repeat every {dayName}?
        </label>
        
        <button
          onClick={handleRepeatToggle}
          disabled={isUnavailable}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            isRepeatEnabled
              ? 'bg-primary-500'
              : isUnavailable
                ? 'bg-gray-200'
                : 'bg-gray-300 hover:bg-gray-400'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
              isRepeatEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Additional Info */}
      {!isUnavailable && selectedSlots.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">
            Available slots: {selectedSlots.length}
          </div>
          <div className="text-xs text-gray-400">
            Available for 30, 60, or 90 min sessions
          </div>
        </div>
      )}
    </div>
  );
};

export default DayAvailabilityCard;