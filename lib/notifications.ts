import webpush from "web-push";
import { getDb } from "@/lib/db";
import { dayjs } from "@/lib/time";
import { getNotificationSettings, NotificationSettings } from "@/lib/notification-settings";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

function configured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

function setup() {
  if (!configured()) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  return true;
}

export function vapidPublicKey() { return process.env.VAPID_PUBLIC_KEY || null; }

export function saveSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const now = Date.now();
  getDb().prepare(`INSERT INTO push_subscriptions(endpoint,p256dh,auth,created_at,last_seen_at)
    VALUES(?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, enabled=1, last_seen_at=excluded.last_seen_at`)
    .run(sub.endpoint, sub.keys.p256dh, sub.keys.auth, now, now);
}

export function disableSubscription(endpoint: string) { getDb().prepare("UPDATE push_subscriptions SET enabled=0 WHERE endpoint=?").run(endpoint); }

export function enqueueJob(type: "feed_reminder" | "daily_summary", scheduledAt: number, dedupeKey: string, payload: PushPayload) {
  getDb().prepare(`INSERT INTO notification_jobs(type,scheduled_at,dedupe_key,payload,created_at)
    VALUES(?,?,?,?,?) ON CONFLICT(dedupe_key) DO UPDATE SET scheduled_at=excluded.scheduled_at, payload=excluded.payload, status='pending', error=NULL`)
    .run(type, scheduledAt, dedupeKey, JSON.stringify(payload), Date.now());
}

function feedReminderPayload(hours: number): PushPayload {
  return {
    title: "宝宝喂奶提醒", body: `距离上次喝奶已满 ${hours} 小时，可以关注宝宝是否需要进食。`, url: "/", tag: "feed-reminder",
  };
}

/** 更新待发送提醒，也用于将旧版本的两小时提醒迁移到新设置。 */
function refreshPendingFeedReminders() {
  const { feedReminderHours } = getNotificationSettings();
  getDb().prepare(`UPDATE notification_jobs SET
    scheduled_at=(SELECT started_at FROM feeds WHERE 'feed-reminder-' || id=dedupe_key) + ?, payload=?
    WHERE type='feed_reminder' AND status='pending'
    AND EXISTS(SELECT 1 FROM feeds WHERE 'feed-reminder-' || id=dedupe_key)`)
    .run(feedReminderHours * 60 * 60 * 1000, JSON.stringify(feedReminderPayload(feedReminderHours)));
}

/** 根据当前最新喂奶记录重建唯一的喂奶提醒。 */
export function rescheduleLatestFeedReminder() {
  const db = getDb();
  db.prepare("UPDATE notification_jobs SET status='cancelled' WHERE type='feed_reminder' AND status='pending'").run();
  const latest = db.prepare("SELECT id, started_at FROM feeds ORDER BY started_at DESC, id DESC LIMIT 1").get() as
    | { id: number; started_at: number }
    | undefined;
  if (!latest) return;
  const { feedReminderHours } = getNotificationSettings();
  enqueueJob("feed_reminder", latest.started_at + feedReminderHours * 60 * 60 * 1000,
    `feed-reminder-${latest.id}`, feedReminderPayload(feedReminderHours));
}

export async function sendDueNotifications(now = Date.now()) {
  refreshPendingFeedReminders();
  if (!setup()) return { sent: 0, skipped: true };
  const db = getDb();
  const jobs = db.prepare("SELECT * FROM notification_jobs WHERE status='pending' AND scheduled_at<=? ORDER BY scheduled_at LIMIT 100").all(now) as any[];
  const subs = db.prepare("SELECT * FROM push_subscriptions WHERE enabled=1").all() as any[];
  let sent = 0;
  for (const job of jobs) {
    const payload = JSON.parse(job.payload) as PushPayload;
    if (job.type === "daily_summary") {
      const d = dayjs(job.scheduled_at);
      const start = d.startOf("day").valueOf();
      const end = d.endOf("day").valueOf();
      const feedStat = db.prepare(`SELECT COUNT(*) AS count,
        COALESCE(SUM(CASE WHEN method='bottle' THEN amount_ml ELSE 0 END),0) AS ml
        FROM feeds WHERE started_at BETWEEN ? AND ?`).get(start, end) as any;
      const diaperStat = db.prepare("SELECT COUNT(*) AS count FROM diapers WHERE happened_at BETWEEN ? AND ?").get(start, end) as any;
      payload.body = `今日喂奶 ${feedStat.count} 次，瓶喂 ${feedStat.ml} ml，尿布 ${diaperStat.count} 次。`;
    }
    let delivered = false;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload));
        delivered = true;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) disableSubscription(sub.endpoint);
      }
    }
    db.prepare("UPDATE notification_jobs SET status=?, attempts=attempts+1, sent_at=?, error=? WHERE id=?")
      .run(delivered ? "sent" : "failed", delivered ? now : null, delivered ? null : "无可用订阅", job.id);
    if (delivered) sent++;
  }
  return { sent, skipped: false };
}

export function ensureDailySummaryJob(now = Date.now()) {
  const current = dayjs(now);
  const { dailySummaryTime } = getNotificationSettings();
  const [hour, minute] = dailySummaryTime.split(":").map(Number);
  const db = getDb();
  // 同步已有的待发送任务；已发送任务保持原状态，避免修改时间后重复推送。
  const pending = db.prepare("SELECT id, scheduled_at FROM notification_jobs WHERE type='daily_summary' AND status='pending'").all() as { id: number; scheduled_at: number }[];
  for (const job of pending) {
    const target = dayjs(job.scheduled_at).hour(hour).minute(minute).second(0).millisecond(0);
    db.prepare("UPDATE notification_jobs SET scheduled_at=? WHERE id=?").run(target.valueOf(), job.id);
  }
  for (const day of [current, current.add(1, "day")]) {
    const target = day.hour(hour).minute(minute).second(0).millisecond(0);
    // 保留今天的任务，即使 cron 在目标分钟之后才执行，也不会漏掉统计。
    db.prepare(`INSERT INTO notification_jobs(type,scheduled_at,dedupe_key,payload,created_at)
      VALUES('daily_summary',?,?,?,?) ON CONFLICT(dedupe_key) DO NOTHING`)
      .run(target.valueOf(), `daily-summary-${target.format("YYYY-MM-DD")}`, JSON.stringify({
        title: "今日喂养统计", body: "", url: "/stats", tag: "daily-summary",
      }), now);
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE notification_settings SET feed_reminder_hours=?, daily_summary_time=? WHERE id=1")
      .run(settings.feedReminderHours, settings.dailySummaryTime);
    refreshPendingFeedReminders();
    ensureDailySummaryJob();
  })();
}
