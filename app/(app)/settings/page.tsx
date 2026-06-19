"use client";

import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
  }

  return (
    <>
      <PageHeader title="设置" />
      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4">
          <div className="font-semibold mb-1">🍼 宝宝喂养助手</div>
          <div className="text-sm text-[var(--muted)]">
            喂奶、亲喂、换尿布记录工具。数据保存在本机 SQLite 文件中。
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)]">
          <button
            onClick={logout}
            className="tap w-full text-left px-4 py-3 text-red-500"
          >
            退出登录
          </button>
        </div>

        <div className="text-xs text-[var(--muted)] text-center pt-4">
          v0.1 · 移动端 PWA · 本地存储
        </div>
      </main>
    </>
  );
}
