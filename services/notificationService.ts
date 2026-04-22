import * as Notifications from 'expo-notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  category: string;
  priority_score: number;
}

// ---------------------------------------------------------------------------
// Stable notification identifiers
// Used as tags so we can cancel and replace specific notifications without
// wiping unrelated ones.
// ---------------------------------------------------------------------------

const ID_DAILY_TOP_FIVE   = 'priority-app:daily-top-five';
const ID_EOD_RECAP        = 'priority-app:end-of-day-recap';
const ID_WEEKLY_RECAP     = 'priority-app:weekly-recap';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Configures the in-app notification handler once.
 * Shows a banner and plays a sound even when the app is foregrounded.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Cancels a notification by its stable identifier.
 * Silently no-ops if no matching notification exists.
 */
async function cancelById(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // No-op — the notification simply wasn't scheduled yet.
  }
}

/**
 * Selects and formats the top-5 tasks by priority_score into a numbered
 * list string suitable for a notification body.
 *
 * @example "1. Call doctor\n2. Submit report\n3. ..."
 */
function buildTopFiveBody(tasks: Task[]): string {
  const top5 = [...tasks]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 5);

  if (top5.length === 0) return 'No tasks yet — great job staying on top of things!';

  return top5.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Requests push-notification permissions from the OS.
 *
 * @returns true if the user granted permission, false if denied.
 *   Always call this before scheduling any notifications.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();

  // Don't re-prompt if already granted.
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    console.warn(
      'NotificationService: permission denied. Notifications will not be shown.',
    );
    return false;
  }

  return true;
}

/**
 * Schedules a daily repeating "Top 5" notification at the user's preferred time.
 * Any previously scheduled top-five notification is cancelled first so there
 * are never duplicate entries.
 *
 * @param tasks  - Full task list; the top 5 by priority_score are extracted internally.
 * @param hour   - Hour in 24-hr format (0–23).
 * @param minute - Minute (0–59).
 */
export async function scheduleDailyTopFive(
  tasks: Task[],
  hour: number,
  minute: number,
): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  // Replace any existing daily notification with the fresh task list.
  await cancelById(ID_DAILY_TOP_FIVE);

  await Notifications.scheduleNotificationAsync({
    identifier: ID_DAILY_TOP_FIVE,
    content: {
      title: 'Your Top 5 for Today 🎯',
      body: buildTopFiveBody(tasks),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedules a daily end-of-day recap notification.
 * Any previously scheduled recap is cancelled first.
 *
 * @param completedCount - Number of tasks completed today.
 * @param totalCount     - Total number of tasks the user had today.
 * @param hour           - Hour in 24-hr format (0–23).
 * @param minute         - Minute (0–59).
 */
export async function scheduleEndOfDayRecap(
  completedCount: number,
  totalCount: number,
  hour: number,
  minute: number,
): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await cancelById(ID_EOD_RECAP);

  const body =
    totalCount === 0
      ? "No tasks were scheduled for today — enjoy the downtime!"
      : `You completed ${completedCount} of ${totalCount} task${totalCount !== 1 ? 's' : ''} today. Keep it up!`;

  await Notifications.scheduleNotificationAsync({
    identifier: ID_EOD_RECAP,
    content: {
      title: 'Day Wrap-up 📋',
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedules a weekly Sunday-morning recap notification at 9:00 AM.
 * Any previously scheduled weekly recap is cancelled first.
 *
 * @param completedTaskTitles - Titles of tasks completed during the week.
 *   Only the first 5 are shown in the notification body.
 */
export async function scheduleWeeklySundayRecap(
  completedTaskTitles: string[],
): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await cancelById(ID_WEEKLY_RECAP);

  const topTitles = completedTaskTitles.slice(0, 5);
  const body =
    topTitles.length === 0
      ? "A fresh week starts now — you've got this!"
      : `This week you completed:\n${topTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  await Notifications.scheduleNotificationAsync({
    identifier: ID_WEEKLY_RECAP,
    content: {
      title: 'Your Week in Review 🌟',
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = Sunday in expo-notifications (1=Sun … 7=Sat)
      hour: 9,
      minute: 0,
    },
  });
}

/**
 * Cancels every scheduled notification managed by this service.
 * Call this on user logout or when the user opts out of notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Convenience function for the Settings screen: cancels the existing daily
 * top-five notification and reschedules it at the new time with the same tasks.
 *
 * @param tasks     - Current task list (same shape as scheduleDailyTopFive).
 * @param newHour   - New hour in 24-hr format.
 * @param newMinute - New minute.
 */
export async function updateNotificationTime(
  tasks: Task[],
  newHour: number,
  newMinute: number,
): Promise<void> {
  // scheduleDailyTopFive already cancels the previous entry before re-creating,
  // so a direct delegate call is sufficient here.
  await scheduleDailyTopFive(tasks, newHour, newMinute);
}
