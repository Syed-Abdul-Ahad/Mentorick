exports.hasDuplicateSlots = (slots) => {
  const set = new Set(slots.map(s => s.hour));
  return set.size !== slots.length;
};

exports.isValidHour = (hour) => hour >= 0 && hour <= 23;
