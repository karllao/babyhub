import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __babyhub_db: Database.Database | undefined;
}

function open(): Database.Database {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "baby.db");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feeds (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      method      TEXT NOT NULL CHECK(method IN ('bottle','breast')),
      content     TEXT CHECK(content IN ('formula','breastmilk')),
      amount_ml   INTEGER,
      side        TEXT CHECK(side IN ('left','right','both')),
      duration_s  INTEGER,
      started_at  INTEGER NOT NULL,
      note        TEXT,
      created_at  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_feeds_started ON feeds(started_at DESC);

    CREATE TABLE IF NOT EXISTS diapers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      pee         INTEGER NOT NULL,
      poop        INTEGER NOT NULL,
      poop_amount TEXT CHECK(poop_amount IN ('small','medium','large')),
      happened_at INTEGER NOT NULL,
      note        TEXT,
      created_at  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_diapers_happened ON diapers(happened_at DESC);

    CREATE TABLE IF NOT EXISTS pumps (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at  INTEGER NOT NULL,
      ended_at    INTEGER NOT NULL,
      amount_ml   INTEGER NOT NULL,
      note        TEXT,
      created_at  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pumps_started ON pumps(started_at DESC);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notification_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('feed_reminder','daily_summary')),
      scheduled_at INTEGER NOT NULL,
      dedupe_key TEXT NOT NULL UNIQUE,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','cancelled','failed')),
      attempts INTEGER NOT NULL DEFAULT 0,
      sent_at INTEGER,
      error TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notification_jobs_due ON notification_jobs(status, scheduled_at);
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      feed_reminder_hours REAL NOT NULL DEFAULT 3,
      daily_summary_time TEXT NOT NULL DEFAULT '23:55'
    );
    INSERT OR IGNORE INTO notification_settings(id) VALUES(1);
  `);
}

export function getDb(): Database.Database {
  if (!global.__babyhub_db) {
    global.__babyhub_db = open();
  }
  return global.__babyhub_db;
}

export type FeedRow = {
  id: number;
  method: "bottle" | "breast";
  content: "formula" | "breastmilk" | null;
  amount_ml: number | null;
  side: "left" | "right" | "both" | null;
  duration_s: number | null;
  started_at: number;
  note: string | null;
  created_at: number;
};

export type DiaperRow = {
  id: number;
  pee: number;
  poop: number;
  poop_amount: "small" | "medium" | "large" | null;
  happened_at: number;
  note: string | null;
  created_at: number;
};

export type PumpRow = {
  id: number;
  started_at: number;
  ended_at: number;
  amount_ml: number;
  note: string | null;
  created_at: number;
};
