/**
 * Convert display label to hour number (backend compatible)
 * Examples: "12 AM" -> 0, "1 PM" -> 13, "12 PM" -> 12
 */
export const labelToHour = (label) => {
  const [time, meridian] = label.split(' ');
  let hour = parseInt(time, 10);

  if (meridian === 'PM' && hour !== 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;

  return hour;
};

/**
 * Convert hour number to display label
 * Examples: 0 -> "12 AM", 13 -> "1 PM", 12 -> "12 PM"
 */
export const hourToLabel = (hour) => {
  const meridian = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${meridian}`;
};

/**
 * Build payload for weekly availability API
 */
export const buildWeeklyPayload = (dayOfWeek, slots) => ({
  dayOfWeek,
  slots: slots.map(hour => ({ hour }))
});

/**
 * Build payload for date-specific availability API
 */
export const buildDatePayload = (date, slots) => ({
  date,
  slots: slots.map(hour => ({ hour }))
});

/**
 * Get user's current timezone
 */
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get next 7 days from today
 */
export const getNext7Days = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (date) => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  
  return {
    dayName,
    dateString: `${day} - ${month}`,
    fullDate: date.toISOString().split('T')[0]
  };
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Generate time slots for AM/PM
 */
export const generateTimeSlots = (period) => {
  const slots = [];
  const start = period === 'AM' ? 0 : 12;
  const end = period === 'AM' ? 12 : 24;
  
  for (let hour = start; hour < end; hour++) {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayPeriod = hour < 12 ? 'AM' : 'PM';
    slots.push({
      value: hour,
      display: `${displayHour.toString().padStart(2, '0')}:00`,
      label: `${displayHour} ${displayPeriod}`
    });
  }
  
  return slots;
};

/**
 * Get period (AM/PM) for hour
 */
export const getPeriodForHour = (hour) => {
  return hour < 12 ? 'AM' : 'PM';
};