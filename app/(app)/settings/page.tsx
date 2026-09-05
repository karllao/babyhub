"use client";

import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function enableNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setStatus("此设备或浏览器不支持推送");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setStatus("通知权限未开启");
    const reg = await navigator.serviceWorker.register("/sw.js");
    const cfg = await fetch("/api/notifications/config").then((r) => r.json());
    if (!cfg.publicKey) return setStatus("服务器尚未配置 VAPID 密钥");
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(cfg.publicKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)) });
    await fetch("/api/notifications/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
    setStatus("通知已开启");
  }

  async function testNotification() { await fetch("/api/notifications/test", { method: "POST" }); await fetch("/api/notifications/run", { method: "POST" }); setStatus("测试通知已发送"); }

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
          <button onClick={enableNotifications} className="tap w-full text-left px-4 py-3">开启 iOS 推送通知</button>
          <button onClick={testNotification} className="tap w-full text-left px-4 py-3">发送测试通知</button>
          <button
            onClick={logout}
            className="tap w-full text-left px-4 py-3 text-red-500"
          >
            退出登录
          </button>
        </div>
        {status && <div className="text-sm text-[var(--muted)] text-center">{status}</div>}

        <div className="text-xs text-[var(--muted)] text-center pt-4">
          v0.1 · 移动端 PWA · 本地存储
        </div>
      </main>
    </>
  );
}
