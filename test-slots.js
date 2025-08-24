function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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

console.log('Testing slot generation:');
console.log('Start: 09:00, End: 17:00, Duration: 60');
const slots = generateTimeSlotsWithDuration('09:00', '17:00', 60);
console.log('Number of slots:', slots.length);
console.log('Slots:', JSON.stringify(slots, null, 2));
