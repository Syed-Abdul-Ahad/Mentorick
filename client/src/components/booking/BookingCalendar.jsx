import { useState, useEffect } from 'react';
import { availabilityService, bookingService } from '../../api';
import { 
  getUserTimezone, 
  formatTimeWithTimezone,
  isTimeSlotInPast,
  formatDateInTimezone 
} from '../../utils/timezone';
import Button from '../shared/Button';
import Toast from '../shared/Toast';

const BookingCalendar = ({ mentorId, mentorName, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [customStartTime, setCustomStartTime] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [notes, setNotes] = useState('');
  const [userTimezone] = useState(getUserTimezone());
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotStatus, setSlotStatus] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailabilityData();
    }
  }, [selectedDate, mentorId]);

  // Reset custom time when duration changes
  useEffect(() => {
    setCustomStartTime('');
    setSlotStatus(null);
    setSelectedAvailability(null);
  }, [duration]);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getAvailableSlots(
        mentorId,
        selectedDate,
        userTimezone,
        60 // We just need the availability windows and existing bookings
      );
      
      if (response && response.availability) {
        setAvailability(response.availability);
        setExistingBookings(response.existingBookings || []);
      }
    } catch (error) {
      console.error('Error fetching availability data:', error);
      showToast('Failed to load availability data', 'error');
      setAvailability([]);
      setExistingBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCustomSlot = async () => {
    if (!customStartTime || !selectedAvailability) {
      return;
    }

    try {
      setCheckingSlot(true);
      const response = await availabilityService.checkCustomSlot(
        mentorId,
        {
          date: selectedDate,
          startTime: customStartTime,
          duration: duration
        }
      );

      setSlotStatus(response);
    } catch (error) {
      console.error('Error checking slot:', error);
      setSlotStatus({
        available: false,
        message: 'Error checking slot availability'
      });
    } finally {
      setCheckingSlot(false);
    }
  };

  // Check slot availability when time or duration changes
  useEffect(() => {
    if (customStartTime && selectedAvailability) {
      const timeoutId = setTimeout(() => {
        checkCustomSlot();
      }, 500); // Debounce API calls

      return () => clearTimeout(timeoutId);
    }
  }, [customStartTime, duration, selectedAvailability]);

  const handleBookSlot = async () => {
    if (!slotStatus || !slotStatus.available) {
      showToast('Please select a valid time slot', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const bookingData = {
        mentorId,
        availabilityId: slotStatus.availabilityId,
        scheduledDate: selectedDate,
        startTime: customStartTime,
        duration,
        notes,
        menteeTimezone: userTimezone,
      };

      const response = await bookingService.createBooking(bookingData);
      
      showToast('Booking created successfully!', 'success');
      
      // Reset form
      setCustomStartTime('');
      setNotes('');
      setSlotStatus(null);
      
      // Refresh availability data
      fetchAvailabilityData();
      
      if (onBookingSuccess) {
        onBookingSuccess(response.booking);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showToast(error.response?.data?.message || 'Failed to create booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) { // 15-minute intervals
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const isTimeWithinAvailability = (time, availWindow) => {
    const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const startMinutes = parseInt(availWindow.startTime.split(':')[0]) * 60 + parseInt(availWindow.startTime.split(':')[1]);
    const endMinutes = parseInt(availWindow.endTime.split(':')[0]) * 60 + parseInt(availWindow.endTime.split(':')[1]);
    
    return timeMinutes >= startMinutes && (timeMinutes + duration) <= endMinutes;
  };

  const getAvailableTimeOptions = () => {
    if (!selectedAvailability) return [];
    
    return generateTimeOptions().filter(time => 
      isTimeWithinAvailability(time, selectedAvailability) &&
      !isTimeSlotInPast(selectedDate, time, userTimezone)
    );
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
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return dates;
  };

  const timeOptions = generateTimeOptions();
  const availableTimeOptions = getAvailableTimeOptions();
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
          {/* Duration Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Session Duration
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="30"
                  checked={duration === 30}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">
                  30 minutes
                  <span className="text-gray-500 block text-xs">Quick session</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="60"
                  checked={duration === 60}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">
                  60 minutes
                  <span className="text-gray-500 block text-xs">Standard session</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="90"
                  checked={duration === 90}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">
                  90 minutes
                  <span className="text-gray-500 block text-xs">Extended session</span>
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

          {/* Availability Windows Display */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-2">Loading availability...</p>
            </div>
          )}

          {!loading && availability.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No availability for this date</p>
            </div>
          )}

          {!loading && availability.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Availability Window
              </label>
              <div className="space-y-2">
                {availability.map((avail) => (
                  <div
                    key={avail.id}
                    onClick={() => setSelectedAvailability(avail)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAvailability?.id === avail.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-medium">
                      {formatTimeWithTimezone(avail.startTime, userTimezone)} - {formatTimeWithTimezone(avail.endTime, userTimezone)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Available for {duration} minute sessions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Time Selection */}
          {selectedAvailability && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Start Time
              </label>
              <select
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a start time...</option>
                {availableTimeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTimeWithTimezone(time, userTimezone)}
                  </option>
                ))}
              </select>
              
              {/* Slot Status Display */}
              {customStartTime && (
                <div className="mt-3">
                  {checkingSlot && (
                    <div className="flex items-center text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                      Checking availability...
                    </div>
                  )}
                  
                  {!checkingSlot && slotStatus && (
                    <div className={`p-3 rounded-lg ${
                      slotStatus.available 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <div className="font-medium">
                        {slotStatus.available ? '✅ Slot Available' : '❌ Slot Not Available'}
                      </div>
                      <div className="text-sm mt-1">
                        {formatTimeWithTimezone(customStartTime, userTimezone)} - {formatTimeWithTimezone(slotStatus.endTime, userTimezone)} ({duration} minutes)
                      </div>
                      {slotStatus.message && (
                        <div className="text-sm mt-1">{slotStatus.message}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Existing Bookings Display */}
          {existingBookings.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Already Booked Time Slots
              </label>
              <div className="space-y-2">
                {existingBookings.map((booking, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="text-red-800 font-medium">
                      {formatTimeWithTimezone(booking.startTime, userTimezone)} - {formatTimeWithTimezone(booking.endTime, userTimezone)}
                    </div>
                    <div className="text-red-600 text-sm">
                      ({booking.duration} minutes) - Already booked
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {slotStatus?.available && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topics or questions you'd like to discuss..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="3"
                maxLength="500"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {notes.length}/500 characters
              </div>
            </div>
          )}

          {/* Book Button */}
          {slotStatus?.available && (
            <div className="flex justify-end">
              <Button
                onClick={handleBookSlot}
                disabled={loading}
                className="px-6 py-2"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          )}
        </div>
      </div>

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

export default BookingCalendar;
