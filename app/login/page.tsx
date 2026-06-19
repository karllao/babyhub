"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "登录失败");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setErr("网络异常,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-3">🍼</div>
        <h1 className="text-2xl font-semibold">宝宝喂养助手</h1>
        <p className="text-sm text-[var(--muted)] mt-1">请输入访问码进入</p>
      </div>
      <input
        autoFocus
        type="password"
        inputMode="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="访问码"
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-lg tabular outline-none focus:border-brand-500"
      />
      {err && <div className="text-sm text-red-500 text-center">{err}</div>}
      <button
        type="submit"
        disabled={loading || !code}
        className="tap w-full rounded-2xl bg-brand-500 text-white py-4 text-lg font-semibold active:bg-brand-600 disabled:opacity-50"
      >
        {loading ? "验证中…" : "进入"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6">
      <Suspense fallback={<div className="text-[var(--muted)]">加载中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
