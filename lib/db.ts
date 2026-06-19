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
