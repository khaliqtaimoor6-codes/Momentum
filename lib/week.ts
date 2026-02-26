export function getCurrentWeekStartDate(referenceDate: Date = new Date()): Date {
  // Use UTC to avoid timezone-related shifts in the stored week start
  const date = new Date(referenceDate);
  const day = date.getUTCDay(); // 0 (Sun) - 6 (Sat)

  // Treat Monday as the first day of the week
  const diffToMonday = (day + 6) % 7; // 0 if Monday, 1 if Tuesday, ...

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - diffToMonday);

  return date;
}
