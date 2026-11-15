const DEFAULT_LEAD_HOURS = 24;

export const getMinLeadHours = () => DEFAULT_LEAD_HOURS;

/**
 * Returns true if a local date + HH:mm start is at least `leadHours` from now.
 */
export const isSlotBookableByLeadTime = (dateStr, startHHMM, leadHours = DEFAULT_LEAD_HOURS) => {
  if (!dateStr || !startHHMM) return false;
  const start = new Date(`${dateStr}T${startHHMM}:00`);
  if (Number.isNaN(start.getTime())) return false;
  const earliest = Date.now() + leadHours * 60 * 60 * 1000;
  return start.getTime() >= earliest;
};

export const isMegaSessionBookableByLeadTime = (startTimeUTC, leadHours = DEFAULT_LEAD_HOURS) => {
  if (!startTimeUTC) return false;
  const start = new Date(startTimeUTC);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() >= Date.now() + leadHours * 60 * 60 * 1000;
};
