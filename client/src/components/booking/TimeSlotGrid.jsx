import React from 'react';
import { formatTimeTo12Hour } from '../../utils/timezone';
import { formatDurationLabel } from '../../utils/durationDisplay';
import { isSlotBookableByLeadTime, getMinLeadHours } from '../../utils/bookingLeadTime';

/**
 * Time slot grid — presentation only.
 * Slots under the minimum lead time stay visible but disabled.
 */
const TimeSlotGrid = ({ slots, selectedSlot, onSlotSelect, loading, selectedDate }) => {
  const leadHours = getMinLeadHours();

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
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Time</h3>
      <p className="text-xs text-gray-500 mb-4">
        Sessions must be booked at least {leadHours} hours in advance. Closer slots stay visible but cannot be selected.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.start === slot.start;
          const maxDuration = Math.max(...slot.durations);
          const bookable = isSlotBookableByLeadTime(selectedDate, slot.start, leadHours);

          return (
            <button
              key={slot.start}
              type="button"
              disabled={!bookable}
              onClick={() => bookable && onSlotSelect(slot)}
              title={!bookable ? `Available only ${leadHours}+ hours before the session` : undefined}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                !bookable
                  ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70'
                  : isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-bold text-lg">{formatTimeTo12Hour(slot.start)}</div>
              <div className="text-xs text-gray-500 mt-2">
                {bookable ? `Up to ${formatDurationLabel(maxDuration)}` : `Within ${leadHours}h`}
              </div>
              {bookable && (
                <div className="text-xs mt-1">
                  {slot.durations.map((duration) => formatDurationLabel(duration)).join(', ')}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotGrid;
