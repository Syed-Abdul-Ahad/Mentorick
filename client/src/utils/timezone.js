// Timezone detection and conversion utilities

/**
 * Get user's current timezone
 * @returns {string} IANA timezone identifier
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Unable to detect timezone, falling back to UTC');
    return 'UTC';
  }
};

/**
 * Convert time from one timezone to another
 * @param {string} time - Time in HH:mm format
 * @param {string} date - Date string
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @returns {string} Converted time in HH:mm format
 */
export const convertTimeToTimezone = (time, date, fromTimezone, toTimezone) => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const dateObj = new Date(date);
    dateObj.setHours(hours, minutes, 0, 0);

    // Create a date with the source timezone
    const sourceDate = new Date(dateObj.toLocaleString('en-US', { timeZone: fromTimezone }));
    
    // Convert to target timezone
    const targetDate = new Date(sourceDate.toLocaleString('en-US', { timeZone: toTimezone }));
    
    // Calculate the difference
    const diff = targetDate.getTime() - sourceDate.getTime();
    const adjustedDate = new Date(dateObj.getTime() + diff);
    
    const convertedHours = adjustedDate.getHours().toString().padStart(2, '0');
    const convertedMinutes = adjustedDate.getMinutes().toString().padStart(2, '0');
    
    return `${convertedHours}:${convertedMinutes}`;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return time; // Return original time if conversion fails
  }
};

/**
 * Get timezone offset in hours
 * @param {string} timezone - IANA timezone identifier
 * @returns {number} Offset in hours
 */
export const getTimezoneOffset = (timezone) => {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0;
  }
};

/**
 * Format time with timezone
 * @param {string} time - Time in HH:mm format
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Formatted time with timezone abbreviation
 */
export const formatTimeWithTimezone = (time, timezone) => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting time with timezone:', error);
    return `${time} (${timezone})`;
  }
};

/**
 * Get timezone abbreviation
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Timezone abbreviation
 */
export const getTimezoneAbbreviation = (timezone) => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart ? timeZonePart.value : timezone;
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return timezone;
  }
};

/**
 * Check if a time slot is in the past
 * @param {string} date - Date string
 * @param {string} time - Time in HH:mm format
 * @param {string} timezone - IANA timezone identifier
 * @returns {boolean} True if the slot is in the past
 */
export const isTimeSlotInPast = (date, time, timezone) => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    return slotDate < nowInTimezone;
  } catch (error) {
    console.error('Error checking if time slot is in past:', error);
    return false;
  }
};

/**
 * Get common timezones for dropdown
 * @returns {Array} Array of timezone objects
 */
export const getCommonTimezones = () => {
  return [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'EST/EDT (Eastern Time)' },
    { value: 'America/Chicago', label: 'CST/CDT (Central Time)' },
    { value: 'America/Denver', label: 'MST/MDT (Mountain Time)' },
    { value: 'America/Los_Angeles', label: 'PST/PDT (Pacific Time)' },
    { value: 'Europe/London', label: 'GMT/BST (London)' },
    { value: 'Europe/Paris', label: 'CET/CEST (Paris)' },
    { value: 'Europe/Berlin', label: 'CET/CEST (Berlin)' },
    { value: 'Asia/Karachi', label: 'PKT (Pakistan Standard Time)' },
    { value: 'Asia/Dubai', label: 'GST (Gulf Standard Time)' },
    { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
    { value: 'Asia/Shanghai', label: 'CST (China Standard Time)' },
    { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
    { value: 'Australia/Sydney', label: 'AEST/AEDT (Sydney)' },
  ];
};

/**
 * Convert availability slots to user's timezone
 * @param {Array} slots - Array of time slots
 * @param {string} fromTimezone - Source timezone
 * @param {string} toTimezone - Target timezone
 * @param {string} date - Date string
 * @returns {Array} Converted slots
 */
export const convertSlotsToTimezone = (slots, fromTimezone, toTimezone, date) => {
  if (fromTimezone === toTimezone) return slots;
  
  return slots.map(slot => ({
    ...slot,
    startTime: convertTimeToTimezone(slot.startTime, date, fromTimezone, toTimezone),
    endTime: convertTimeToTimezone(slot.endTime, date, fromTimezone, toTimezone),
    originalStartTime: slot.startTime,
    originalEndTime: slot.endTime,
    originalTimezone: fromTimezone,
    convertedTimezone: toTimezone,
  }));
};

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param {string} time - Time in HH:mm format
 * @returns {string} Time in 12-hour format with AM/PM
 */
export const formatTimeTo12Hour = (time) => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time to 12-hour format:', error);
    return time; // Return original time if conversion fails
  }
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Formatted date
 */
export const formatDateInTimezone = (date, timezone) => {
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date in timezone:', error);
    return new Date(date).toLocaleDateString();
  }
};
