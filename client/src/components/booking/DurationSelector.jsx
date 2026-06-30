import {
  formatDurationLabel,
  getDurationDescription,
} from '../../utils/durationDisplay';

/**
 * Duration selector — presentation only.
 * Available durations come from the API (backend booking engine).
 */
const DurationSelector = ({ availableDurations, selectedDuration, onDurationSelect, disabled }) => {
  const normalizedDurations = (availableDurations || [])
    .map((duration) => {
      if (typeof duration === 'number') return duration;
      const parsed = parseInt(String(duration).replace(/\D/g, ''), 10);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((duration) => duration !== null);

  const normalizedSelected = typeof selectedDuration === 'number'
    ? selectedDuration
    : parseInt(String(selectedDuration).replace(/\D/g, ''), 10);

  if (normalizedDurations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please select a time slot first</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Duration</h3>
      <div className="space-y-3">
        {normalizedDurations.map((duration) => {
          const isSelected = normalizedSelected === duration;

          return (
            <button
              key={duration}
              type="button"
              onClick={() => onDurationSelect(duration)}
              disabled={disabled}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                    {formatDurationLabel(duration)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {getDurationDescription(duration)}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DurationSelector;
