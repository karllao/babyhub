"use client";

import clsx from "clsx";

type Opt<T> = { value: T; label: string; emoji?: string };

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "md" | "lg";
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={clsx(
              "tap rounded-2xl border-2 font-medium flex flex-col items-center justify-center gap-1 transition-colors",
              size === "lg" ? "py-5 text-lg" : "py-3 text-base",
              active
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--fg)]"
            )}
          >
            {o.emoji && <span className="text-2xl leading-none">{o.emoji}</span>}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
