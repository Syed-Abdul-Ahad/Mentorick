const { DateTime } = require('luxon');

jest.mock('../../paymentConfig', () => ({
  getBookingMinLeadHours: () => 0,
}));

const {
  mergeConsecutiveHoursToWindows,
  subtractBookingsFromWindows,
} = require('../windows');
const { deriveBookableSlots, groupSlotsForApi } = require('../deriveSlots');
const { generateAvailability } = require('../availabilityEngine');
const {
  parseDurationMinutes,
  getMentorSupportedDurations,
} = require('../duration');
const {
  validateBookableSlot,
  validateCreateBooking,
} = require('../validation');

const TZ = 'Asia/Karachi';
const testDate = DateTime.fromObject({ year: 2026, month: 7, day: 3 }, { zone: TZ });

function localWindowBounds(windows, index = 0) {
  const start = DateTime.fromJSDate(windows[index].startUTC, { zone: 'utc' }).setZone(TZ);
  const end = DateTime.fromJSDate(windows[index].endUTC, { zone: 'utc' }).setZone(TZ);
  return { start, end };
}

describe('duration helpers', () => {
  test('parseDurationMinutes handles strings and numbers', () => {
    expect(parseDurationMinutes(60)).toBe(60);
    expect(parseDurationMinutes('90 min')).toBe(90);
    expect(parseDurationMinutes('30')).toBe(30);
  });

  test('getMentorSupportedDurations normalizes profile entries', () => {
    expect(getMentorSupportedDurations([
      { duration: '30 min' },
      { duration: '90 min' },
    ])).toEqual([30, 90]);
  });
});

describe('continuous availability windows', () => {
  test('merges consecutive hours into one window (5 PM → 8 PM)', () => {
    const windows = mergeConsecutiveHoursToWindows([17, 18, 19], testDate, TZ);
    expect(windows).toHaveLength(1);

    const { start, end } = localWindowBounds(windows);
    expect(start.hour).toBe(17);
    expect(end.hour).toBe(20);
  });

  test('isolates non-consecutive hours into separate windows', () => {
    const windows = mergeConsecutiveHoursToWindows([17, 19], testDate, TZ);
    expect(windows).toHaveLength(2);

    const first = localWindowBounds(windows, 0);
    const second = localWindowBounds(windows, 1);
    expect(first.start.hour).toBe(17);
    expect(first.end.hour).toBe(18);
    expect(second.start.hour).toBe(19);
    expect(second.end.hour).toBe(20);
  });

  test('splits a window around an existing booking (5–8 PM minus 6:00–6:30)', () => {
    const windows = mergeConsecutiveHoursToWindows([17, 18, 19], testDate, TZ);
    const booking = {
      startTimeUTC: DateTime.fromObject(
        { year: 2026, month: 7, day: 3, hour: 18, minute: 0 },
        { zone: TZ }
      ).toUTC().toJSDate(),
      endTimeUTC: DateTime.fromObject(
        { year: 2026, month: 7, day: 3, hour: 18, minute: 30 },
        { zone: TZ }
      ).toUTC().toJSDate(),
    };

    const free = subtractBookingsFromWindows(windows, [booking]);
    expect(free).toHaveLength(2);

    const before = localWindowBounds(free, 0);
    const after = localWindowBounds(free, 1);
    expect(before.start.toFormat('HH:mm')).toBe('17:00');
    expect(before.end.toFormat('HH:mm')).toBe('18:00');
    expect(after.start.toFormat('HH:mm')).toBe('18:30');
    expect(after.end.toFormat('HH:mm')).toBe('20:00');
  });
});

describe('cross-hour slot generation', () => {
  const allDurations = [15, 30, 60, 90];
  const windows = mergeConsecutiveHoursToWindows([19, 20, 21], testDate, TZ);

  test('7:15, 7:30, and 7:45 support 60- and 90-minute sessions', () => {
    const slots = deriveBookableSlots(windows, allDurations, TZ);

    for (const start of ['19:15', '19:30', '19:45']) {
      const slot = slots.find((s) => s.startLocal === start);
      expect(slot).toBeDefined();
      expect(slot.durations).toContain(60);
      expect(slot.durations).toContain(90);
    }
  });
});

describe('non-consecutive hours cannot bridge gaps', () => {
  test('5 PM window cannot book 60 minutes starting at 5:45 across the 6 PM gap', () => {
    const windows = mergeConsecutiveHoursToWindows([17, 19], testDate, TZ);
    const slots = deriveBookableSlots(windows, [15, 30, 60, 90], TZ);

    const slot1745 = slots.find((s) => s.startLocal === '17:45');
    expect(slot1745).toBeDefined();
    expect(slot1745.durations).not.toContain(60);
    expect(slot1745.durations).not.toContain(90);
  });
});

describe('mentor duration filtering', () => {
  const baseProfile = {
    timezone: TZ,
    sessionDurations: [
      { duration: '30 min', priceUSD: 10, pricePKR: 2800 },
      { duration: '60 min', priceUSD: 20, pricePKR: 5600 },
    ],
    availability: {
      weekly: [{
        dayOfWeek: 5,
        isActive: true,
        slots: [{ hour: 19 }, { hour: 20 }, { hour: 21 }],
      }],
      specificDates: [],
      unavailability: [],
    },
  };

  test('only mentor-supported durations appear in API slots', () => {
    const friday = DateTime.fromObject({ year: 2026, month: 7, day: 3 }, { zone: TZ });
    const availability = generateAvailability({
      mentorProfile: baseProfile,
      bookings: [],
      menteeTimezone: TZ,
      daysAhead: 1,
      startFrom: friday,
    });

    const day = availability[0];
    expect(day.slots.length).toBeGreaterThan(0);
    expect(day.slots.every((slot) => slot.durations.every((d) => [30, 60].includes(d)))).toBe(true);
    expect(day.slots.some((slot) => slot.durations.includes(15))).toBe(false);
    expect(day.slots.some((slot) => slot.durations.includes(90))).toBe(false);
  });

  test('all four catalog durations appear when mentor supports them and window allows', () => {
    const fullProfile = {
      ...baseProfile,
      sessionDurations: [
        { duration: '15 min', priceUSD: 5, pricePKR: 1400 },
        { duration: '30 min', priceUSD: 10, pricePKR: 2800 },
        { duration: '60 min', priceUSD: 20, pricePKR: 5600 },
        { duration: '90 min', priceUSD: 30, pricePKR: 8400 },
      ],
    };

    const friday = DateTime.fromObject({ year: 2026, month: 7, day: 3 }, { zone: TZ });
    const availability = generateAvailability({
      mentorProfile: fullProfile,
      bookings: [],
      menteeTimezone: TZ,
      daysAhead: 1,
      startFrom: friday,
    });

    const slot1900 = availability[0].slots.find((s) => s.start === '19:00');
    expect(slot1900).toBeDefined();
    expect(slot1900.durations).toEqual(expect.arrayContaining([15, 30, 60, 90]));
  });
});

describe('booking validation uses the same engine as availability API', () => {
  const mentorProfile = {
    timezone: TZ,
    sessionDurations: [
      { duration: '30 min', priceUSD: 10, pricePKR: 2800 },
      { duration: '60 min', priceUSD: 20, pricePKR: 5600 },
      { duration: '90 min', priceUSD: 30, pricePKR: 8400 },
    ],
    availability: {
      weekly: [{
        dayOfWeek: 5,
        isActive: true,
        slots: [{ hour: 19 }, { hour: 20 }, { hour: 21 }],
      }],
      specificDates: [],
      unavailability: [],
    },
  };

  // Next Friday from "now" so validation (which regenerates availability from now) still matches
  const friday = DateTime.now().setZone(TZ).plus({ days: (5 - DateTime.now().setZone(TZ).weekday + 7) % 7 || 7 }).startOf('day');

  test('accepts every slot the availability API generated', () => {
    const availability = generateAvailability({
      mentorProfile,
      bookings: [],
      menteeTimezone: TZ,
      daysAhead: 14,
      startFrom: friday,
    });

    const day = availability.find((d) => d.date === friday.toISODate()) || availability[0];
    expect(day).toBeTruthy();
    for (const slot of day.slots) {
      for (const duration of slot.durations) {
        const startTimeISO = `${day.date}T${slot.start}:00`;
        const result = validateBookableSlot({
          mentorProfile,
          bookings: [],
          startTimeISO,
          durationMinutes: duration,
          requestTimezone: TZ,
        });
        expect(result.valid).toBe(true);
      }
    }
  });

  test('rejects a start time that availability API did not generate', () => {
    const result = validateBookableSlot({
      mentorProfile,
      bookings: [],
      startTimeISO: '2026-07-03T17:45:00',
      durationMinutes: 60,
      requestTimezone: TZ,
    });
    expect(result.valid).toBe(false);
  });

  test('rejects a duration that availability API did not offer for a valid start', () => {
    const result = validateBookableSlot({
      mentorProfile,
      bookings: [],
      startTimeISO: '2026-07-03T19:45:00',
      durationMinutes: 15,
      requestTimezone: TZ,
    });
    expect(result.valid).toBe(false);
  });

  test('validateCreateBooking rejects slots blocked by existing bookings (same engine as API)', () => {
    const existingBooking = {
      startTimeUTC: DateTime.fromObject(
        { year: 2026, month: 7, day: 3, hour: 19, minute: 30 },
        { zone: TZ }
      ).toUTC().toJSDate(),
      endTimeUTC: DateTime.fromObject(
        { year: 2026, month: 7, day: 3, hour: 20, minute: 30 },
        { zone: TZ }
      ).toUTC().toJSDate(),
      status: 'confirmed',
    };

    const result = validateCreateBooking({
      mentorProfile,
      bookings: [existingBooking],
      startTimeISO: '2026-07-03T19:15:00',
      duration: 60,
      timezone: TZ,
      currency: 'USD',
    });

    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.reason).toMatch(/not available/i);
  });
});

describe('API response grouping', () => {
  test('groups slots by date for API response', () => {
    const slots = deriveBookableSlots(
      mergeConsecutiveHoursToWindows(
        [10, 11],
        DateTime.fromObject({ year: 2026, month: 7, day: 3 }, { zone: 'UTC' }),
        'UTC'
      ),
      [30, 60],
      'UTC'
    );
    const grouped = groupSlotsForApi(slots);
    expect(grouped[0]).toHaveProperty('date');
    expect(grouped[0]).toHaveProperty('slots');
  });
});
