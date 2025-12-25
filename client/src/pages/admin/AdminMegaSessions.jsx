import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { mentorService, megaSessionService } from '../../api/services';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import MentorAvailabilityCalendar from '../../components/booking/MentorAvailabilityCalendar';
import TimeSlotGrid from '../../components/booking/TimeSlotGrid';
import DurationSelector from '../../components/booking/DurationSelector';
import { useMentorAvailability } from '../../hooks/useMentorAvailability';
import { formatTimeTo12Hour } from '../../utils/timezone';

const AdminMegaSessions = () => {
  const { user } = useSelector((state) => state.auth);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    maxParticipants: 10,
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Mentor, 2: Select Date, 3: Select Time, 4: Select Duration, 5: Create Session

  // Use the existing mentor availability hook
  const { 
    availability, 
    loading: availabilityLoading, 
    error: availabilityError 
  } = useMentorAvailability(selectedMentor?.user?._id);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </MainLayout>
    );
  }

  // Fetch all mentors
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await mentorService.getAllMentors();
        setMentors(response || []);
      } catch (error) {
        toast.error('Failed to fetch mentors');
        console.error(error);
      }
    };

    fetchMentors();
  }, []);

  // Handle mentor selection
  const handleMentorSelect = (mentor) => {
    setSelectedMentor(mentor);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedDuration(60);
    setStep(2);
  };

  // Handle date selection (using existing component)
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(3);
  };

  // Handle slot selection (using existing component)
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  // Handle duration selection (using existing component)  
  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration);
    setStep(5);
  };

  // Get available slots for selected date (same logic as BookingModal)
  const selectedDateSlots = selectedDate 
    ? availability.find(day => day.date === selectedDate)?.slots || []
    : [];

  // Create mega session
  const handleCreateMegaSession = async (e) => {
    e.preventDefault();
    if (!selectedMentor || !selectedSlot) return;

    setLoading(true);
    try {
      // Format the startTime as ISO string (same as BookingModal)
      const startTime = `${selectedDate}T${selectedSlot.start}`;
      
      const sessionData = {
        mentorId: selectedMentor.user._id,
        startTime,
        duration: selectedDuration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: sessionForm.currency,
        title: sessionForm.title,
        description: sessionForm.description,
        maxParticipants: sessionForm.maxParticipants
      };

      await megaSessionService.createMegaSession(sessionData);
      toast.success('Mega session created successfully!');
      
      // Reset form
      setSelectedMentor(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedDuration(60);
      setStep(1);
      setSessionForm({
        title: '',
        description: '',
        maxParticipants: 10,
        currency: 'USD'
      });
      
    } catch (error) {
      toast.error(error.message || 'Failed to create mega session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Mega Session</h1>
          <p className="text-gray-600">Select a mentor, choose availability, and create a group session.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>1</div>
            <div className="w-12 h-1 bg-gray-200 mx-1"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>2</div>
            <div className="w-12 h-1 bg-gray-200 mx-1"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>3</div>
            <div className="w-12 h-1 bg-gray-200 mx-1"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>4</div>
            <div className="w-12 h-1 bg-gray-200 mx-1"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 5 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>5</div>
          </div>
        </div>

        {/* Step 1: Select Mentor */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Step 1: Select Mentor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <Card key={mentor._id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="p-6" onClick={() => handleMentorSelect(mentor)}>
                    <div className="flex items-center mb-4">
                      <img
                        src={mentor.headshot || '/default-avatar.png'}
                        alt={mentor.fullName}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{mentor.fullName}</h3>
                        <p className="text-sm text-gray-600">{mentor.title}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">{mentor.about}</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.topics?.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date using existing component */}
        {step === 2 && selectedMentor && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Step 2: Select Date</h2>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to Mentors
              </Button>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Selected Mentor:</h3>
              <div className="flex items-center">
                <img
                  src={selectedMentor.headshot || '/default-avatar.png'}
                  alt={selectedMentor.fullName}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div>
                  <span className="font-medium">{selectedMentor.fullName}</span>
                  <span className="text-gray-600 ml-2">({selectedMentor.title})</span>
                </div>
              </div>
            </div>

            <Card>
              <MentorAvailabilityCalendar
                availability={availability}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                loading={availabilityLoading}
              />
            </Card>

            {availabilityError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">Error loading availability: {availabilityError}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Time using existing component */}
        {step === 3 && selectedDate && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Step 3: Select Time Slot</h2>
              <Button variant="outline" onClick={() => setStep(2)}>
                Back to Dates
              </Button>
            </div>

            <Card>
              <TimeSlotGrid
                slots={selectedDateSlots}
                selectedSlot={selectedSlot}
                onSlotSelect={handleSlotSelect}
                loading={false}
              />
            </Card>
          </div>
        )}

        {/* Step 4: Select Duration using existing component */}
        {step === 4 && selectedSlot && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Step 4: Select Duration</h2>
              <Button variant="outline" onClick={() => setStep(3)}>
                Back to Time Slots
              </Button>
            </div>

            <Card>
              <DurationSelector
                availableDurations={selectedMentor?.sessionDurations?.map(session => session.duration) || []}
                selectedDuration={selectedDuration}
                onDurationSelect={handleDurationSelect}
              />
            </Card>
          </div>
        )}

        {/* Step 5: Create Session */}
        {step === 5 && selectedDuration && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Step 5: Create Mega Session</h2>
              <Button variant="outline" onClick={() => setStep(4)}>
                Back to Duration
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Session Details Form */}
              <Card className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Session Details</h3>
                <form onSubmit={handleCreateMegaSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Title
                    </label>
                    <input
                      type="text"
                      required
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Career Development Workshop"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      value={sessionForm.description}
                      onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what this session will cover..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Participants
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={sessionForm.maxParticipants}
                        onChange={(e) => setSessionForm({ ...sessionForm, maxParticipants: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={sessionForm.currency}
                        onChange={(e) => setSessionForm({ ...sessionForm, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="PKR">PKR</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Mega Session'}
                  </Button>
                </form>
              </Card>

              {/* Session Summary */}
              <Card className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Session Summary</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mentor:</span>
                    <p className="font-medium">{selectedMentor?.fullName}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                    <p className="font-medium">
                      {selectedSlot && formatTimeTo12Hour(selectedSlot.start)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Duration:</span>
                    <p className="font-medium">{selectedDuration} minutes</p>
                  </div>

                  {sessionForm.title && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Title:</span>
                      <p className="font-medium">{sessionForm.title}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-gray-600">Max Participants:</span>
                    <p className="font-medium">{sessionForm.maxParticipants} people</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminMegaSessions;