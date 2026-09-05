import webpush from "web-push";
import { getDb } from "@/lib/db";
import { dayjs } from "@/lib/time";

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

/** 根据当前最新喂奶记录重建唯一的两小时提醒。 */
export function rescheduleLatestFeedReminder() {
  const db = getDb();
  db.prepare("UPDATE notification_jobs SET status='cancelled' WHERE type='feed_reminder' AND status='pending'").run();
  const latest = db.prepare("SELECT id, started_at FROM feeds ORDER BY started_at DESC, id DESC LIMIT 1").get() as
    | { id: number; started_at: number }
    | undefined;
  if (!latest) return;
  enqueueJob("feed_reminder", latest.started_at + 2 * 60 * 60 * 1000, `feed-reminder-${latest.id}`, {
    title: "宝宝喂奶提醒", body: "距离上次喝奶已满 2 小时，可以关注宝宝是否需要进食。", url: "/", tag: "feed-reminder",
  });
}

export async function sendDueNotifications(now = Date.now()) {
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
  let target = current.hour(23).minute(30).second(0).millisecond(0);
  if (target.valueOf() <= now) target = target.add(1, "day");
  const dateKey = target.format("YYYY-MM-DD");
  const db = getDb();
  const start = current.startOf("day").valueOf();
  const end = current.endOf("day").valueOf();
  const stat = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(CASE WHEN method='bottle' THEN amount_ml ELSE 0 END),0) AS ml
    FROM feeds WHERE started_at BETWEEN ? AND ?`).get(start, end) as any;
  const diaperStat = db.prepare("SELECT COUNT(*) AS count FROM diapers WHERE happened_at BETWEEN ? AND ?").get(start, end) as any;
  enqueueJob("daily_summary", target.valueOf(), `daily-summary-${dateKey}`, {
    title: "今日喂养统计", body: `今日喂奶 ${stat.count} 次，瓶喂 ${stat.ml} ml，尿布 ${diaperStat.count} 次。`, url: "/stats", tag: "daily-summary",
  });
}
