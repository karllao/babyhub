import { z } from "zod";
import { getDb } from "@/lib/db";

export const NotificationSettingsInput = z.object({
  feedReminderHours: z.number().finite().min(0.5).max(24).multipleOf(0.5),
  dailySummaryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export type NotificationSettings = z.infer<typeof NotificationSettingsInput>;

export function getNotificationSettings(): NotificationSettings {
  return getDb().prepare(`SELECT feed_reminder_hours AS feedReminderHours,
    daily_summary_time AS dailySummaryTime FROM notification_settings WHERE id=1`).get() as NotificationSettings;
}
