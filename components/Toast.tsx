"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = { id: number; text: string; kind?: "ok" | "err" };
type Ctx = { push: (text: string, kind?: "ok" | "err") => void };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setList((s) => [...s, { id, text, kind }]);
    setTimeout(() => setList((s) => s.filter((t) => t.id !== id)), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
        style={{ top: "calc(env(safe-area-inset-top) + 16px)" }}
      >
        {list.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-full px-4 py-2 text-sm shadow-lg " +
              (t.kind === "err"
                ? "bg-red-500 text-white"
                : "bg-black/85 text-white dark:bg-white/90 dark:text-black")
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("ToastProvider missing");
  return c;
}

/** 简单 hook:页面级 - 不依赖 Provider 时的兜底 */
export function useLocalToast() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    if (!list.length) return;
    const t = setTimeout(() => setList((s) => s.slice(1)), 2200);
    return () => clearTimeout(t);
  }, [list]);
  return {
    list,
    push: (text: string, kind: "ok" | "err" = "ok") =>
      setList((s) => [...s, { id: Date.now() + Math.random(), text, kind }]),
  };
}
