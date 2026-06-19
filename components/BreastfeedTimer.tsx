"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { fmtTimer } from "@/lib/time";
import { useToast } from "./Toast";
import DateTimeField from "./DateTimeField";

type Side = "left" | "right" | "both";

type Persist = {
  startedAt: number; // 计时开始 wall clock
  accumulated: number; // 暂停前累计秒
  running: boolean;
  lastResumeAt: number; // 上次开始/恢复的 wall clock
  side: "left" | "right" | null;
  touchedLeft: boolean;
  touchedRight: boolean;
};

const KEY = "bh_bf_timer_v1";

function load(): Persist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Persist) : null;
  } catch {
    return null;
  }
}
function save(p: Persist | null) {
  if (typeof window === "undefined") return;
  if (p) localStorage.setItem(KEY, JSON.stringify(p));
  else localStorage.removeItem(KEY);
}

function computeElapsed(p: Persist): number {
  if (!p.running) return p.accumulated;
  return p.accumulated + Math.floor((Date.now() - p.lastResumeAt) / 1000);
}

export default function BreastfeedTimer() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<Persist | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showSave, setShowSave] = useState(false);
  const [note, setNote] = useState("");
  const [at, setAt] = useState<number>(Date.now());
  const [saving, setSaving] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化:从 localStorage 恢复
  useEffect(() => {
    const p = load();
    if (p) {
      setState(p);
      setElapsed(computeElapsed(p));
    }
  }, []);

  // running 时每秒刷新
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (state?.running) {
      tickRef.current = setInterval(() => {
        setElapsed(computeElapsed(state));
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state]);

  function start(side: "left" | "right") {
    const now = Date.now();
    const p: Persist = {
      startedAt: now,
      accumulated: 0,
      running: true,
      lastResumeAt: now,
      side,
      touchedLeft: side === "left",
      touchedRight: side === "right",
    };
    save(p);
    setState(p);
    setElapsed(0);
  }

  function pause() {
    if (!state || !state.running) return;
    const p: Persist = {
      ...state,
      running: false,
      accumulated: computeElapsed(state),
    };
    save(p);
    setState(p);
  }

  function resume() {
    if (!state || state.running) return;
    const p: Persist = { ...state, running: true, lastResumeAt: Date.now() };
    save(p);
    setState(p);
  }

  function switchSide(side: "left" | "right") {
    if (!state) {
      start(side);
      return;
    }
    setState((s) => {
      if (!s) return s;
      const np: Persist = {
        ...s,
        side,
        touchedLeft: s.touchedLeft || side === "left",
        touchedRight: s.touchedRight || side === "right",
      };
      save(np);
      return np;
    });
  }

  function stop() {
    if (!state) return;
    const final = computeElapsed(state);
    setElapsed(final);
    const p: Persist = { ...state, running: false, accumulated: final };
    save(p);
    setState(p);
    setAt(state.startedAt);
    setShowSave(true);
  }

  function discard() {
    save(null);
    setState(null);
    setElapsed(0);
    setShowSave(false);
    setNote("");
  }

  async function commit() {
    if (!state) return;
    const side: Side = state.touchedLeft && state.touchedRight ? "both" : state.touchedLeft ? "left" : "right";
    setSaving(true);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: "breast",
          side,
          duration_s: Math.max(1, elapsed),
          started_at: at,
          note: note || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.push(j.error || "保存失败", "err");
        return;
      }
      toast.push("已记录 ✓");
      save(null);
      router.push("/");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const running = !!state?.running;
  const hasSession = !!state;
  const activeSide = state?.side ?? null;

  return (
    <div className="px-4 pt-2 pb-32 max-w-md mx-auto">
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 text-center mt-2">
        <div className="text-[var(--muted)] text-sm">{running ? "正在计时" : hasSession ? "已暂停" : "选择哺乳侧开始"}</div>
        <div className="text-7xl font-bold tabular mt-2">{fmtTimer(elapsed)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        {(["left", "right"] as const).map((s) => {
          const active = activeSide === s;
          const touched = s === "left" ? state?.touchedLeft : state?.touchedRight;
          return (
            <button
              key={s}
              onClick={() => switchSide(s)}
              className={clsx(
                "tap rounded-2xl border-2 py-8 flex flex-col items-center justify-center gap-2 transition-colors",
                active
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                  : touched
                  ? "border-brand-300 bg-brand-50/50 dark:bg-brand-900/10"
                  : "border-[var(--border)] bg-[var(--card)]"
              )}
            >
              <span className="text-4xl">{s === "left" ? "🫲" : "🫱"}</span>
              <span className="font-semibold text-lg">{s === "left" ? "左侧" : "右侧"}</span>
              {touched && !active && <span className="text-xs text-[var(--muted)]">已喂过</span>}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-3 mt-6">
        {!hasSession && (
          <div className="text-xs text-[var(--muted)] text-center">点击上方左侧或右侧按钮即可开始</div>
        )}
        {hasSession && (
          <>
            {running ? (
              <button
                onClick={pause}
                className="tap flex items-center gap-2 rounded-2xl bg-amber-500 text-white px-6 py-4 font-semibold"
              >
                <Pause size={22} /> 暂停
              </button>
            ) : (
              <button
                onClick={resume}
                className="tap flex items-center gap-2 rounded-2xl bg-emerald-500 text-white px-6 py-4 font-semibold"
              >
                <Play size={22} /> 继续
              </button>
            )}
            <button
              onClick={stop}
              className="tap flex items-center gap-2 rounded-2xl bg-brand-500 text-white px-6 py-4 font-semibold"
            >
              <Square size={22} /> 结束
            </button>
            <button
              onClick={discard}
              className="tap flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-4 text-[var(--muted)]"
              aria-label="清除"
              title="清除当前计时"
            >
              <RotateCcw size={20} />
            </button>
          </>
        )}
      </div>

      {showSave && state && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end" onClick={() => setShowSave(false)}>
          <div
            className="w-full bg-[var(--bg)] rounded-t-3xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            <div className="w-10 h-1.5 bg-[var(--border)] rounded-full mx-auto" />
            <h2 className="text-lg font-semibold">确认亲喂记录</h2>
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">时长</span>
                <span className="font-semibold tabular">{fmtTimer(elapsed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">哺乳侧</span>
                <span className="font-semibold">
                  {state.touchedLeft && state.touchedRight
                    ? "左右两侧"
                    : state.touchedLeft
                    ? "左侧"
                    : "右侧"}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1 pl-1">开始时间</div>
              <DateTimeField value={at} onChange={setAt} />
            </div>
            <div>
              <div className="text-xs text-[var(--muted)] mb-1 pl-1">备注</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="(可选)"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-base outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSave(false)}
                className="tap flex-1 rounded-2xl border border-[var(--border)] py-3"
              >
                继续计时
              </button>
              <button
                onClick={commit}
                disabled={saving || elapsed < 1}
                className="tap flex-[2] rounded-2xl bg-brand-500 text-white py-3 font-semibold disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
