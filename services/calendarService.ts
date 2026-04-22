import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  title: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the start (midnight) and end (23:59:59.999) of a given date.
 */
function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Returns the IDs of every calendar available on the device.
 * Returns an empty array if the user has no calendars.
 */
async function getAllCalendarIds(): Promise<string[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.map((c) => c.id);
}

/**
 * Maps a raw expo-calendar event to our leaner CalendarEvent shape.
 */
function toCalendarEvent(raw: Calendar.Event): CalendarEvent {
  return {
    title: raw.title ?? '(No title)',
    startTime: new Date(raw.startDate),
    endTime: new Date(raw.endDate),
    isAllDay: raw.allDay ?? false,
    location: raw.location ?? undefined,
  };
}

/**
 * Formats a Date to 12-hour time, e.g. "9:00 AM" or "2:30 PM".
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a human-readable day label relative to today:
 * "Today", "Tomorrow", or a short weekday + date like "Fri Apr 25".
 */
function dayLabel(date: Date): string {
  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toDateString();

  if (date.toDateString() === todayStr) return 'Today';
  if (date.toDateString() === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Requests read-only calendar access from the OS.
 *
 * - iOS: requests the default expo-calendar permission.
 * - Android: requests READ_CALENDAR specifically.
 *
 * @returns true if the user grants access, false if denied.
 */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      console.warn('CalendarService: calendar permission denied on Android.');
      return false;
    }
    return true;
  }

  // iOS
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    console.warn('CalendarService: calendar permission denied on iOS.');
    return false;
  }
  return true;
}

/**
 * Fetches all calendar events for today (midnight → 23:59:59) across every
 * calendar on the device, sorted by start time ascending.
 *
 * @returns Array of CalendarEvent objects. Empty array if no calendars or events.
 */
export async function getTodaysEvents(): Promise<CalendarEvent[]> {
  const calendarIds = await getAllCalendarIds();
  if (calendarIds.length === 0) return [];

  const { start, end } = dayBounds(new Date());

  const raw = await Calendar.getEventsAsync(calendarIds, start, end);

  return raw
    .map(toCalendarEvent)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Fetches calendar events from now until `days` days in the future, across
 * every calendar on the device, sorted by start time ascending.
 *
 * @param days - How many days ahead to look (default: 7).
 * @returns Array of CalendarEvent objects sorted by startTime.
 */
export async function getUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
  const calendarIds = await getAllCalendarIds();
  if (calendarIds.length === 0) return [];

  const start = new Date();
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

  const raw = await Calendar.getEventsAsync(calendarIds, start, end);

  return raw
    .map(toCalendarEvent)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Converts an array of CalendarEvents into a plain-English string designed
 * to be injected directly into a GPT-4o prompt.
 *
 * Format:
 *   Today's schedule:
 *   - 9:00 AM – 10:00 AM: Team standup
 *   - 2:00 PM – 3:00 PM: Doctor appointment
 *
 *   Upcoming (next 7 days):
 *   - Tomorrow 3:00 PM: Flight to NYC
 *
 * All-day events are shown with "(All day)" instead of a time range.
 * Returns 'No upcoming calendar events.' when the array is empty.
 *
 * @param events - Sorted array of CalendarEvent objects.
 */
export function formatEventsForAIContext(events: CalendarEvent[]): string {
  if (events.length === 0) return 'No upcoming calendar events.';

  const todayStr = new Date().toDateString();

  const todayEvents  = events.filter((e) => e.startTime.toDateString() === todayStr);
  const futureEvents = events.filter((e) => e.startTime.toDateString() !== todayStr);

  const formatEvent = (e: CalendarEvent, includeDay: boolean): string => {
    const timeStr = e.isAllDay
      ? '(All day)'
      : `${formatTime(e.startTime)} – ${formatTime(e.endTime)}`;

    const prefix = includeDay ? `${dayLabel(e.startTime)} ` : '';
    return `- ${prefix}${timeStr}: ${e.title}`;
  };

  const lines: string[] = [];

  if (todayEvents.length > 0) {
    lines.push("Today's schedule:");
    lines.push(...todayEvents.map((e) => formatEvent(e, false)));
  }

  if (futureEvents.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Upcoming (next 7 days):');
    lines.push(...futureEvents.map((e) => formatEvent(e, true)));
  }

  return lines.join('\n');
}

/**
 * One-shot convenience function for OpenAIService.ts.
 *
 * Requests permissions → fetches the next 7 days of events → formats them
 * into an AI-ready context string, all in a single call.
 *
 * @returns A formatted calendar context string, or a graceful fallback message
 *   if the user has denied calendar access or has no events.
 */
export async function getCalendarContextForPrioritization(): Promise<string> {
  const granted = await requestPermissions();
  if (!granted) return 'Calendar access not granted.';

  const events = await getUpcomingEvents(7);
  return formatEventsForAIContext(events);
}
