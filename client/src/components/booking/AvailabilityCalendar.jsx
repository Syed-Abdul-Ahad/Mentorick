import { useState, useEffect } from 'react';
import { availabilityService } from '../../api';
import { getUserTimezone, getCommonTimezones, formatTimeWithTimezone } from '../../utils/timezone';
import Button from '../shared/Button';
import FormInput from '../shared/FormInput';
import Toast from '../shared/Toast';

const AvailabilityCalendar = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    timezone: getUserTimezone(),
    isRecurring: true,
    specificDate: '',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getMyAvailability();
      setAvailability(response.availability || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      showToast('Failed to load availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSlot) {
        // Update existing availability
        await availabilityService.updateAvailability(editingSlot._id, formData);
        showToast('Availability updated successfully');
      } else {
        // Create new availability
        await availabilityService.createAvailability(formData);
        showToast('Availability created successfully');
      }
      
      setShowForm(false);
      setEditingSlot(null);
      resetForm();
      fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      showToast(error.message || 'Failed to save availability', 'error');
    }
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timezone: slot.timezone,
      slotDuration: slot.slotDuration,
      isRecurring: slot.isRecurring,
      specificDate: slot.specificDate ? new Date(slot.specificDate).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      await availabilityService.deleteAvailability(slotId);
      showToast('Availability deleted successfully');
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      showToast(error.message || 'Failed to delete availability', 'error');
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      await availabilityService.updateAvailability(slot._id, {
        isActive: !slot.isActive
      });
      showToast(`Availability ${slot.isActive ? 'disabled' : 'enabled'} successfully`);
      fetchAvailability();
    } catch (error) {
      console.error('Error toggling availability:', error);
      showToast('Failed to update availability', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: getUserTimezone(),
      slotDuration: 60,
      isRecurring: true,
      specificDate: '',
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  // Group availability by day for better display
  const groupedAvailability = daysOfWeek.reduce((acc, day, index) => {
    acc[day] = availability.filter(slot => 
      slot.isRecurring && slot.dayOfWeek === index && slot.isActive
    );
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-gray-600">Loading availability...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Availability Calendar</h2>
        <Button 
          onClick={() => {
            setEditingSlot(null);
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Add Availability
        </Button>
      </div>

      {/* Weekly Availability Display */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">{day}</h4>
              {groupedAvailability[day].length > 0 ? (
                <div className="space-y-2">
                  {groupedAvailability[day].map((slot) => (
                    <div key={slot._id} className="bg-primary-50 p-2 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-primary-700">
                            {formatTimeWithTimezone(slot.startTime, slot.timezone)} - 
                            {formatTimeWithTimezone(slot.endTime, slot.timezone)}
                          </p>
                          <p className="text-gray-600 text-xs">
                            Available for 30, 60, or 90 min sessions
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(slot)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(slot)}
                            className={`text-xs ${slot.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {slot.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDelete(slot._id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No availability set</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingSlot ? 'Edit Availability' : 'Add Availability'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recurring vs One-time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.isRecurring}
                      onChange={() => setFormData({ ...formData, isRecurring: true })}
                      className="mr-2"
                    />
                    Weekly Recurring
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.isRecurring}
                      onChange={() => setFormData({ ...formData, isRecurring: false })}
                      className="mr-2"
                    />
                    Specific Date
                  </label>
                </div>
              </div>

              {/* Day of Week or Specific Date */}
              {formData.isRecurring ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {daysOfWeek.map((day, index) => (
                      <option key={day} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <FormInput
                  label="Specific Date"
                  type="date"
                  value={formData.specificDate}
                  onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                  required={!formData.isRecurring}
                />
              )}

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
                <FormInput
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {getCommonTimezones().map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="btn-primary flex-1">
                  {editingSlot ? 'Update' : 'Add'} Availability
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingSlot(null);
                    resetForm();
                  }}
                  className="btn-primary-outline flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
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

export default AvailabilityCalendar;
