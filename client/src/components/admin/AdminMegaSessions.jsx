import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ApiService from '../../api/ApiService';
import Button from '../shared/Button';
import FormInput from '../shared/FormInput';
import Toast from '../shared/Toast';

const AdminMegaSessions = () => {
  const { user } = useSelector(state => state.auth);
  const [megaSessions, setMegaSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mentorId: '',
    scheduledDate: '',
    startTime: '10:00',
    duration: 90,
    maxParticipants: 20,
    price: 0,
    currency: 'USD',
    meetingPlatform: 'zoom',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchMegaSessions();
    fetchMentors();
  }, []);

  const fetchMegaSessions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/mega-sessions');
      if (response.data && response.data.status === 'success') {
        setMegaSessions(response.data.data.megaSessions || []);
      }
    } catch (error) {
      console.error('Error fetching mega sessions:', error);
      showToast('Failed to load mega sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await ApiService.get('/mentors');
      if (response.data && response.data.status === 'success') {
        setMentors(response.data.data.mentors || []);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await ApiService.post('/mega-sessions', formData);
      
      if (response.data && response.data.status === 'success') {
        showToast('Mega session created successfully!');
        setShowForm(false);
        resetForm();
        fetchMegaSessions();
      }
    } catch (error) {
      console.error('Error creating mega session:', error);
      showToast(error.response?.data?.message || 'Failed to create mega session', 'error');
    }
  };

  const handleStatusUpdate = async (sessionId, status, meetingLink = '') => {
    try {
      const updateData = { status };
      if (meetingLink) updateData.meetingLink = meetingLink;
      
      const response = await ApiService.put(`/mega-sessions/${sessionId}/status`, updateData);
      
      if (response.data && response.data.status === 'success') {
        showToast(`Session status updated to ${status}`);
        fetchMegaSessions();
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      showToast('Failed to update session status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mentorId: '',
      scheduledDate: '',
      startTime: '10:00',
      duration: 90,
      maxParticipants: 20,
      price: 0,
      currency: 'USD',
      meetingPlatform: 'zoom',
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading && megaSessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mega Sessions Management</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Create Mega Session
        </Button>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">All Mega Sessions</h2>
        </div>
        
        {megaSessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No mega sessions found.</p>
            <p className="text-sm">Create your first mega session to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {megaSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.title}</div>
                        <div className="text-sm text-gray-500">{session.description}</div>
                        <div className="text-xs text-gray-400">{session.duration} minutes</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.mentor?.user?.firstName} {session.mentor?.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{session.mentor?.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(session.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.startTime} - {session.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.participants?.length || 0} / {session.maxParticipants}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'active' ? 'bg-green-100 text-green-800' :
                        session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {session.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(session._id, 'active')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(session._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {session.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(session._id, 'completed')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Mega Session</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Session Title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Advanced React Patterns"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe what this session will cover..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Mentor
                </label>
                <select
                  value={formData.mentorId}
                  onChange={(e) => setFormData({ ...formData, mentorId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Choose a mentor...</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.user._id} value={mentor.user._id}>
                      {mentor.user.firstName} {mentor.user.lastName} - {mentor.expertise?.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                <FormInput
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
                <FormInput
                  label="Max Participants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                  min="2"
                  max="100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USD">USD</option>
                    <option value="PKR">PKR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Platform
                </label>
                <select
                  value={formData.meetingPlatform}
                  onChange={(e) => setFormData({ ...formData, meetingPlatform: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="btn-primary flex-1">
                  Create Mega Session
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
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

export default AdminMegaSessions;
