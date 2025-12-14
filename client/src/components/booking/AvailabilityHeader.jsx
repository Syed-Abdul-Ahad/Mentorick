import { useState } from 'react';
import { getAllTimezones, formatTimezoneDisplay } from '../../utils/timezoneUtils';

const AvailabilityHeader = ({ 
  selectedTimezone, 
  onTimezoneChange, 
  onOpenUnavailabilityModal 
}) => {
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  const allTimezones = getAllTimezones();
  
  // Filter timezones based on search
  const filteredTimezones = allTimezones.filter(timezone =>
    timezone.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    formatTimezoneDisplay(timezone).toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const handleTimezoneSelect = (timezone) => {
    onTimezoneChange(timezone);
    setShowTimezoneDropdown(false);
    setTimezoneSearch('');
  };

  const displayTimezone = selectedTimezone.replace('_', ' ') + ' Standard Time';

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Title and Timezone */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Your Availability
          </h1>
          
          {/* Timezone Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
            >
              <span className="text-lg">{displayTimezone}</span>
              <svg 
                className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:scale-110" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Timezone Dropdown */}
            {showTimezoneDropdown && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Search timezones..."
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredTimezones.length > 0 ? (
                    filteredTimezones.map(timezone => (
                      <button
                        key={timezone}
                        onClick={() => handleTimezoneSelect(timezone)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                          timezone === selectedTimezone ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{timezone.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">
                          {formatTimezoneDisplay(timezone)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                      No timezones found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Backdrop for closing dropdown */}
            {showTimezoneDropdown && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowTimezoneDropdown(false)}
              ></div>
            )}
          </div>
        </div>

        {/* Unavailability Button */}
        <button
          onClick={onOpenUnavailabilityModal}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-opacity-50"
        >
          Set your Unavailability Date
        </button>
      </div>
    </div>
  );
};

export default AvailabilityHeader;