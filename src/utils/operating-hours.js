/**
 * Utility functions for parsing and formatting operating hours
 * Handles both JSON strings and objects, converts to user-friendly format
 */

/**
 * Convert 24-hour time format to 12-hour AM/PM format
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export function formatTime12Hour(time24) {
  if (!time24 || typeof time24 !== 'string') return time24;

  // Handle various time formats
  const timeMatch = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return time24; // Return original if not in expected format

  const [, hours, minutes] = timeMatch;
  const hour24 = parseInt(hours, 10);
  const min = parseInt(minutes, 10);

  // Convert to 12-hour format
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  // Format minutes with leading zero if needed
  const formattedMinutes = min.toString().padStart(2, '0');

  return `${hour12}:${formattedMinutes} ${period}`;
}

/**
 * Parse operating hours from various formats and return structured data
 * @param {string|object} operatingHours - Raw operating hours data
 * @returns {object|null} Parsed and formatted operating hours
 */
export function parseOperatingHours(operatingHours) {
  if (!operatingHours) return null;

  let hoursData;

  // If it's a string, try to parse as JSON
  if (typeof operatingHours === 'string') {
    try {
      // Handle different JSON string formats
      const cleanedString = operatingHours
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/([{,]\s*)([a-zA-Z_]+):/g, '$1"$2":'); // Add quotes to unquoted keys

      hoursData = JSON.parse(cleanedString);
    } catch {
      console.warn('Failed to parse operating hours JSON:', operatingHours);
      return { raw: operatingHours }; // Return raw string as fallback
    }
  } else if (typeof operatingHours === 'object') {
    hoursData = operatingHours;
  } else {
    return { raw: operatingHours.toString() };
  }

  // Process each day
  const formattedHours = {};
  const dayOrder = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  for (const [day, hours] of Object.entries(hoursData)) {
    const dayLower = day.toLowerCase();

    if (typeof hours === 'string') {
      if (hours.toLowerCase() === 'closed' || hours === '') {
        formattedHours[dayLower] = { formatted: 'Closed', raw: hours };
      } else if (hours.includes('-')) {
        // Handle "HH:MM-HH:MM" format
        const [start, end] = hours.split('-').map((t) => t.trim());
        formattedHours[dayLower] = {
          formatted: `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`,
          raw: hours,
          start: start,
          end: end,
        };
      } else {
        formattedHours[dayLower] = { formatted: hours, raw: hours };
      }
    } else if (typeof hours === 'object' && hours.open && hours.close) {
      // Handle object format { open: "HH:MM", close: "HH:MM" }
      formattedHours[dayLower] = {
        formatted: `${formatTime12Hour(hours.open)} - ${formatTime12Hour(hours.close)}`,
        raw: hours,
        start: hours.open,
        end: hours.close,
      };
    } else {
      formattedHours[dayLower] = { formatted: 'Closed', raw: hours };
    }
  }

  // Return in day order
  const orderedHours = {};
  dayOrder.forEach((day) => {
    if (formattedHours[day]) {
      orderedHours[day] = formattedHours[day];
    }
  });

  // Add any days not in the standard order
  Object.keys(formattedHours).forEach((day) => {
    if (!dayOrder.includes(day)) {
      orderedHours[day] = formattedHours[day];
    }
  });

  return orderedHours;
}

/**
 * Get a summary of operating hours (e.g., "Daily 6:00 AM - 11:00 PM")
 * @param {string|object} operatingHours - Raw operating hours data
 * @returns {string} Summary of operating hours
 */
export function getOperatingHoursSummary(operatingHours) {
  const parsed = parseOperatingHours(operatingHours);
  if (!parsed) return 'Hours not available';

  if (parsed.raw) return parsed.raw; // Fallback for unparseable data

  const entries = Object.entries(parsed);
  if (entries.length === 0) return 'Hours not available';

  // Check if all days have the same hours
  const firstHours = entries[0][1];
  const allSame = entries.every(
    ([, hours]) => hours.formatted === firstHours.formatted
  );

  if (allSame) {
    return `Daily ${firstHours.formatted}`;
  }

  // Check for common patterns (weekdays vs weekend)
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const weekends = ['saturday', 'sunday'];

  const weekdayHours = weekdays
    .filter((day) => parsed[day])
    .map((day) => parsed[day].formatted);
  const weekendHours = weekends
    .filter((day) => parsed[day])
    .map((day) => parsed[day].formatted);

  const weekdaysAllSame =
    weekdayHours.length > 0 && weekdayHours.every((h) => h === weekdayHours[0]);
  const weekendsAllSame =
    weekendHours.length > 0 && weekendHours.every((h) => h === weekendHours[0]);

  if (
    weekdaysAllSame &&
    weekendsAllSame &&
    weekdayHours[0] === weekendHours[0]
  ) {
    return `Daily ${weekdayHours[0]}`;
  } else if (weekdaysAllSame && weekendsAllSame) {
    return `Mon-Fri ${weekdayHours[0]}, Sat-Sun ${weekendHours[0]}`;
  }

  // Default to showing first few days
  return (
    entries
      .slice(0, 2)
      .map(
        ([day, hours]) =>
          `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.formatted}`
      )
      .join(', ') + (entries.length > 2 ? '...' : '')
  );
}
