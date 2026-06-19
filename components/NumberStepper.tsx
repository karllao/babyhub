"use client";

import { useRef } from "react";
import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
};

export default function NumberStepper({
  value,
  onChange,
  step = 10,
  min = 0,
  max = 2000,
  suffix = "ml",
}: Props) {
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdAccel = useRef(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  function startHold(dir: 1 | -1) {
    holdAccel.current = 1;
    holdTimer.current = setInterval(() => {
      holdAccel.current = Math.min(holdAccel.current + 0.4, 8);
      onChange(clamp(value + dir * step * Math.floor(holdAccel.current)));
    }, 120);
  }
  function stopHold() {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="减少"
        onPointerDown={() => startHold(-1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={() => onChange(clamp(value - step))}
        className="tap w-14 h-14 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center active:bg-brand-50 dark:active:bg-brand-900/30"
      >
        <Minus size={28} />
      </button>
      <div className="flex-1 text-center">
        <div className="text-5xl font-bold tabular leading-none">{value}</div>
        <div className="text-xs text-[var(--muted)] mt-1">{suffix}</div>
      </div>
      <button
        type="button"
        aria-label="增加"
        onPointerDown={() => startHold(1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={() => onChange(clamp(value + step))}
        className="tap w-14 h-14 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center active:bg-brand-50 dark:active:bg-brand-900/30"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
