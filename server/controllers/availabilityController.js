const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const MentorProfile = require('../models/MentorProfile');

// @desc    Get mentor availability
// @route   GET /api/availability/:mentorId
// @access  Public
const getMentorAvailability = async (req, res, next) => {
  try {
    const { mentorId } = req.params; // This is actually the user ID
    const { timezone = 'UTC', date } = req.query;

    // Find mentor profile using user ID
    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    let availability;
    
    if (date) {
      // Get availability for specific date using mentorProfile._id
      const targetDate = new Date(date);
      availability = await Availability.findAvailableSlots(mentorProfile._id, targetDate, timezone);
    } else {
      // Get all recurring availability using mentorProfile._id
      availability = await Availability.find({
        mentor: mentorProfile._id,
        isActive: true,
        isRecurring: true,
      }).sort({ dayOfWeek: 1, startTime: 1 });
    }

    res.status(200).json({
      status: 'success',
      data: {
        availability,
        mentor: {
          id: mentorProfile._id,
          userId: mentorId,
          name: mentorProfile.fullName || mentorProfile.name,
          timezone: mentorProfile.timezone || 'UTC',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available time slots for booking
// @route   GET /api/availability/:mentorId/slots
// @access  Public
const getAvailableSlots = async (req, res, next) => {
  try {
    const { mentorId } = req.params; // This is actually the user ID
    const { date, timezone = 'UTC', duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Date is required',
      });
    }

    // Validate duration
    const validDurations = [30, 60, 90];
    const selectedDuration = parseInt(duration);
    if (!validDurations.includes(selectedDuration)) {
      return res.status(400).json({
        status: 'error',
        message: 'Duration must be 30, 60, or 90 minutes',
      });
    }

    // Find mentor profile using user ID
    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    console.log('Debug info:', {
      targetDate,
      dayOfWeek,
      mentorProfileId: mentorProfile._id,
      selectedDuration
    });

    // Get mentor's availability for that day using mentorProfile._id
    const availability = await Availability.find({
      mentor: mentorProfile._id,
      $or: [
        { dayOfWeek, isRecurring: true },
        { 
          specificDate: { 
            $gte: new Date(new Date(date).setHours(0,0,0,0)), 
            $lt: new Date(new Date(date).setHours(23,59,59,999)) 
          } 
        }
      ],
      isActive: true
    });

    console.log('Found availability:', availability.length, availability);

    if (availability.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          slots: [],
          message: 'No availability for this date',
        },
      });
    }

    // Generate time slots based on availability and selected duration
    const allSlots = [];
    
    for (const avail of availability) {
      console.log('Processing availability:', avail.startTime, 'to', avail.endTime);
      const slots = generateTimeSlotsWithDuration(avail.startTime, avail.endTime, selectedDuration);
      console.log('Generated slots:', slots.length, slots);
      
      // Check each slot against existing bookings using mentorProfile._id
      for (const slot of slots) {
        const endTimeStr = minutesToTime(timeToMinutes(slot.startTime) + selectedDuration);
        const isAvailable = await Booking.isSlotAvailable(
          mentorProfile._id,
          new Date(date),
          slot.startTime,
          endTimeStr
        );

        allSlots.push({
          startTime: slot.startTime,
          endTime: endTimeStr,
          duration: selectedDuration,
          available: isAvailable,
          availabilityId: avail._id,
        });
      }
    }

    console.log('Total slots generated:', allSlots.length);

    // Sort slots by time
    allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.status(200).json({
      status: 'success',
      data: {
        slots: allSlots,
        date: new Date(date),
        duration: selectedDuration,
        mentor: {
          id: mentorProfile._id,
          userId: mentorId,
          name: mentorProfile.fullName || mentorProfile.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Update mentor availability
// @route   POST /api/availability
// @access  Private (Mentor only)
const createAvailability = async (req, res, next) => {
  try {
    // Verify user is a mentor
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only mentors can set availability',
      });
    }

    // Find mentor profile using user ID
    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

      const { 
      dayOfWeek, 
      startTime, 
      endTime, 
      timezone = 'UTC', 
      specificDate,
      isRecurring = true 
    } = req.body;    // Validate time format
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid time format. Use HH:mm',
      });
    }

    // Validate that start time is before end time
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Start time must be before end time',
      });
    }

    // Check for overlapping availability using mentorProfile._id
    const existingAvailability = await Availability.findOne({
      mentor: mentorProfile._id,
      dayOfWeek: isRecurring ? dayOfWeek : undefined,
      specificDate: !isRecurring ? new Date(specificDate) : undefined,
      isActive: true,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingAvailability) {
      return res.status(400).json({
        status: 'error',
        message: 'Availability overlaps with existing slot',
      });
    }

    const availabilityData = {
      mentor: mentorProfile._id,
      startTime,
      endTime,
      timezone,
      isRecurring,
    };

    if (isRecurring) {
      availabilityData.dayOfWeek = dayOfWeek;
    } else {
      availabilityData.specificDate = new Date(specificDate);
    }

    const availability = await Availability.create(availabilityData);

    res.status(201).json({
      status: 'success',
      data: {
        availability,
      },
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Availability slot already exists',
      });
    }
    next(error);
  }
};

// @desc    Update mentor availability
// @route   PUT /api/availability/:id
// @access  Private (Mentor only)
const updateAvailability = async (req, res, next) => {
  try {
    // Verify user is a mentor
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only mentors can update availability',
      });
    }

    const mentor = await Mentor.findOne({ user: req.user.id });
    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    const availability = await Availability.findOne({
      _id: req.params.id,
      mentor: mentor._id,
    });

    if (!availability) {
      return res.status(404).json({
        status: 'error',
        message: 'Availability slot not found',
      });
    }

    const { startTime, endTime, timezone, isActive } = req.body;

    // Validate time format if provided
    if (startTime && !isValidTimeFormat(startTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid start time format. Use HH:mm',
      });
    }

    if (endTime && !isValidTimeFormat(endTime)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid end time format. Use HH:mm',
      });
    }

    // Update fields
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (timezone) availability.timezone = timezone;
    if (slotDuration) availability.slotDuration = slotDuration;
    if (typeof isActive === 'boolean') availability.isActive = isActive;

    await availability.save();

    res.status(200).json({
      status: 'success',
      data: {
        availability,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete mentor availability
// @route   DELETE /api/availability/:id
// @access  Private (Mentor only)
const deleteAvailability = async (req, res, next) => {
  try {
    // Verify user is a mentor
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only mentors can delete availability',
      });
    }

    const mentor = await Mentor.findOne({ user: req.user.id });
    if (!mentor) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    const availability = await Availability.findOne({
      _id: req.params.id,
      mentor: mentor._id,
    });

    if (!availability) {
      return res.status(404).json({
        status: 'error',
        message: 'Availability slot not found',
      });
    }

    // Check if there are any future bookings for this availability
    const futureBookings = await Booking.find({
      availability: availability._id,
      scheduledDate: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed'] },
    });

    if (futureBookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete availability with existing bookings',
      });
    }

    await Availability.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mentor's own availability
// @route   GET /api/availability/my-availability
// @access  Private (Mentor only)
const getMyAvailability = async (req, res, next) => {
  try {
    // Verify user is a mentor
    if (req.user.role !== 'mentor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only mentors can access this endpoint',
      });
    }

    // Find mentor profile using user ID
    const mentorProfile = await MentorProfile.findOne({ user: req.user.id });
    if (!mentorProfile) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor profile not found',
      });
    }

    const availability = await Availability.find({
      mentor: mentorProfile._id,
    }).sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        availability,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function generateTimeSlots(startTime, endTime, slotDuration) {
  const slots = [];
  let currentTime = timeToMinutes(startTime);
  const endTimeMinutes = timeToMinutes(endTime);

  while (currentTime + slotDuration <= endTimeMinutes) {
    const startTimeStr = minutesToTime(currentTime);
    const endTimeStr = minutesToTime(currentTime + slotDuration);
    
    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
    
    currentTime += slotDuration;
  }

  return slots;
}

function generateTimeSlotsWithDuration(startTime, endTime, duration) {
  const slots = [];
  let currentTime = timeToMinutes(startTime);
  const endTimeMinutes = timeToMinutes(endTime);

  while (currentTime + duration <= endTimeMinutes) {
    const startTimeStr = minutesToTime(currentTime);
    
    slots.push({
      startTime: startTimeStr,
    });
    
    currentTime += 30; // Generate slots every 30 minutes for flexibility
  }

  return slots;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function isValidTimeFormat(timeStr) {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
}

module.exports = {
  getMentorAvailability,
  getAvailableSlots,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getMyAvailability,
};
