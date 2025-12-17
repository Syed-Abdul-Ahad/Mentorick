import { useState } from 'react';

const UnavailabilityModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  existingRanges = []
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fromDate || !toDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(fromDate, toDate);
      setFromDate('');
      setToDate('');
      onClose();
    } catch (error) {
      console.error('Error setting unavailability:', error);
      alert('Failed to set unavailability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFromDate('');
    setToDate('');
    onClose();
  };

  const handleRemoveRange = (rangeIndex) => {
    // This would be handled by parent component
    onSubmit(null, null, rangeIndex, 'remove');
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Set Unavailability Period
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              If you want to turn off the recurring slot for a period of time, 
              you can set the date range when you'll be unavailable. This will 
              temporarily disable your availability during the selected period.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am not Available From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Setting Unavailability...
                </div>
              ) : (
                'OK'
              )}
            </button>
          </form>

          {/* Existing Unavailability Ranges */}
          {existingRanges.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Current Unavailable Periods
              </h4>
              <div className="space-y-2">
                {existingRanges.map((range, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-700">
                      {new Date(range.from).toLocaleDateString()} - {new Date(range.to).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleRemoveRange(index)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnavailabilityModal;