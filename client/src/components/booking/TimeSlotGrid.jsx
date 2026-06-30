import React from 'react';
import { formatTimeTo12Hour } from '../../utils/timezone';
import { formatDurationLabel } from '../../utils/durationDisplay';

/**
 * Time slot grid — presentation only.
 * Slots and durations are produced by the BookingEngine via the availability API.
 */
const TimeSlotGrid = ({ slots, selectedSlot, onSlotSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
        <p className="text-gray-600">Loading time slots...</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.start === slot.start;
          const maxDuration = Math.max(...slot.durations);

          return (
            <button
              key={slot.start}
              type="button"
              onClick={() => onSlotSelect(slot)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-bold text-lg">{formatTimeTo12Hour(slot.start)}</div>
              <div className="text-xs text-gray-500 mt-2">
                Up to {formatDurationLabel(maxDuration)}
              </div>
              <div className="text-xs mt-1">
                {slot.durations.map((duration) => formatDurationLabel(duration)).join(', ')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotGrid;
