import { useState, useEffect } from 'react';
import { availabilityService, bookingService } from '../../api';
import { 
  getUserTimezone, 
  convertSlotsToTimezone, 
  formatTimeWithTimezone,
  isTimeSlotInPast,
  formatDateInTimezone 
} from '../../utils/timezone';
import Button from '../shared/Button';
import Toast from '../shared/Toast';

const BookingCalendar = ({ mentorId, mentorName, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionType, setSessionType] = useState('1:1');
  const [notes, setNotes] = useState('');
  const [userTimezone] = useState(getUserTimezone());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, sessionType, mentorId]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getAvailableSlots(
        mentorId,
        selectedDate,
        userTimezone,
        sessionType
      );
      
      // Filter out past slots
      const currentSlots = response.slots.filter(slot => 
        !isTimeSlotInPast(selectedDate, slot.startTime, userTimezone)
      );
      
      setAvailableSlots(currentSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      showToast('Failed to load available slots', 'error');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    try {
      const bookingData = {
        mentorId,
        availabilityId: selectedSlot.availabilityId,
        scheduledDate: selectedDate,
        startTime: selectedSlot.originalStartTime || selectedSlot.startTime,
        duration: selectedSlot.duration,
        sessionType,
        notes,
        menteeTimezone: userTimezone,
      };

      const booking = await bookingService.createBooking(bookingData);
      
      showToast('Session booked successfully!');
      setSelectedSlot(null);
      setNotes('');
      
      // Refresh available slots
      fetchAvailableSlots();
      
      // Notify parent component
      if (onBookingSuccess) {
        onBookingSuccess(booking);
      }
    } catch (error) {
      console.error('Error booking session:', error);
      showToast(error.message || 'Failed to book session', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  // Generate next 30 days for date selection
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: formatDateInTimezone(date, userTimezone),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0,
      });
    }
    
    return dates;
  };

  const dateOptions = generateDateOptions();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary-50 px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-primary-800">
            Book a Session with {mentorName}
          </h3>
          <p className="text-primary-600 text-sm mt-1">
            Times shown in your timezone: {userTimezone}
          </p>
        </div>

        <div className="p-6">
          {/* Session Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Session Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="1:1"
                  checked={sessionType === '1:1'}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">
                  1:1 Session
                  <span className="text-gray-500 block text-xs">Private mentoring session</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mega"
                  checked={sessionType === 'mega'}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">
                  Mega Session
                  <span className="text-gray-500 block text-xs">Group mentoring session</span>
                </span>
              </label>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Date
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {dateOptions.slice(0, 14).map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={`p-3 text-center rounded-lg border text-sm transition-colors ${
                    selectedDate === date.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <div className="font-medium">{date.dayName}</div>
                  <div className="text-xs">
                    {new Date(date.value).getDate()}
                  </div>
                  {date.isToday && (
                    <div className="text-xs text-primary-600 font-medium">Today</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Time Slots
            </label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-gray-600">Loading slots...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleBookSlot(slot)}
                    disabled={!slot.available}
                    className={`p-3 text-center rounded-lg border text-sm transition-colors ${
                      slot.available
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-xs text-gray-500">
                      {slot.duration} min
                    </div>
                    {!slot.available && (
                      <div className="text-xs text-red-500 font-medium">
                        Booked
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No available slots for this date.</p>
                <p className="text-sm">Try selecting a different date.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm font-medium text-gray-700">Mentor: </span>
                <span className="text-sm text-gray-900">{mentorName}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Date: </span>
                <span className="text-sm text-gray-900">
                  {formatDateInTimezone(selectedDate, userTimezone)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Time: </span>
                <span className="text-sm text-gray-900">
                  {selectedSlot.startTime} - {selectedSlot.endTime} ({userTimezone})
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Duration: </span>
                <span className="text-sm text-gray-900">{selectedSlot.duration} minutes</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Type: </span>
                <span className="text-sm text-gray-900">
                  {sessionType === '1:1' ? '1:1 Session' : 'Mega Session'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any specific topics or questions you'd like to discuss..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex space-x-3">
              <Button 
                onClick={confirmBooking} 
                className="btn-primary flex-1"
              >
                Confirm Booking
              </Button>
              <Button 
                onClick={() => {
                  setSelectedSlot(null);
                  setNotes('');
                }}
                className="btn-primary-outline flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default BookingCalendar;
