import { useState, useEffect } from 'react';
import { availabilityService } from '../../api';
import { getUserTimezone, formatTimeWithTimezone } from '../../utils/timezone';
import Button from '../shared/Button';
import FormInput from '../shared/FormInput';
import Toast from '../shared/Toast';

const SessionSettings = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
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
      setLoading(true);
      if (editingSlot) {
        await availabilityService.updateAvailability(editingSlot._id, formData);
        showToast('Availability updated successfully');
      } else {
        await availabilityService.createAvailability(formData);
        showToast('Availability created successfully');
      }
      
      fetchAvailability();
      resetForm();
    } catch (error) {
      console.error('Error saving availability:', error);
      showToast(error.response?.data?.message || 'Failed to save availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timezone: slot.timezone,
      isRecurring: slot.isRecurring,
      specificDate: slot.specificDate ? slot.specificDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this availability slot?')) {
      try {
        await availabilityService.deleteAvailability(slotId);
        showToast('Availability deleted successfully');
        fetchAvailability();
      } catch (error) {
        console.error('Error deleting availability:', error);
        showToast('Failed to delete availability', 'error');
      }
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      await availabilityService.updateAvailability(slot._id, {
        ...slot,
        isActive: !slot.isActive
      });
      showToast(`Availability ${!slot.isActive ? 'enabled' : 'disabled'} successfully`);
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
      isRecurring: true,
      specificDate: '',
    });
    setEditingSlot(null);
    setShowForm(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Group availability by day for better display
  const groupedAvailability = daysOfWeek.reduce((acc, day, index) => {
    acc[day] = availability.filter(slot => slot.dayOfWeek === index && slot.isRecurring);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Settings</h1>
            <p className="text-gray-600">Manage your availability and session preferences</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200"
          >
            <span className="mr-2">+</span>
            Add Availability
          </Button>
        </div>
      </div>

      {/* Availability Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center mb-6">
          <div className="bg-primary-100 p-3 rounded-lg mr-4">
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Weekly Schedule</h2>
            <p className="text-gray-600">Your recurring availability for each day of the week</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 text-lg">Loading availability...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900">{day}</h3>
                  <span className="text-2xl">
                    {index === 0 && '☀️'}
                    {index === 1 && '🌟'}
                    {index === 2 && '🔥'}
                    {index === 3 && '🌿'}
                    {index === 4 && '🌙'}
                    {index === 5 && '🎉'}
                    {index === 6 && '🏖️'}
                  </span>
                </div>
                
                {groupedAvailability[day]?.length > 0 ? (
                  <div className="space-y-3">
                    {groupedAvailability[day].map((slot) => (
                      <div
                        key={slot._id}
                        className={`bg-white rounded-lg p-4 border-l-4 transition-all duration-200 ${
                          slot.isActive
                            ? 'border-l-green-500 shadow-sm hover:shadow-md'
                            : 'border-l-gray-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900">
                            {formatTimeWithTimezone(slot.startTime, slot.timezone)} - {formatTimeWithTimezone(slot.endTime, slot.timezone)}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleToggleActive(slot)}
                              className={`w-8 h-8 rounded-full transition-colors duration-200 ${
                                slot.isActive
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title={slot.isActive ? 'Disable' : 'Enable'}
                            >
                              {slot.isActive ? '✓' : '○'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-3">
                          Timezone: {slot.timezone}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(slot)}
                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(slot._id)}
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📅</div>
                    <p className="text-gray-500 text-sm">No availability set</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Availability Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingSlot ? 'Edit Availability' : 'Add Availability'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Day of Week */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  {daysOfWeek.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

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
              <FormInput
                label="Timezone"
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="e.g., Asia/Karachi, UTC"
                required
              />

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    editingSlot ? 'Update Availability' : 'Add Availability'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default SessionSettings;
