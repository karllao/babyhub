"use client";

import PageHeader from "@/components/PageHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [feedReminderHours, setFeedReminderHours] = useState("3");
  const [dailySummaryTime, setDailySummaryTime] = useState("23:55");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState("");

  useEffect(() => {
    fetch("/api/notifications/config")
      .then(async (response) => {
        if (!response.ok) throw new Error("加载推送设置失败，请刷新重试");
        return response.json();
      })
      .then((config) => {
        setFeedReminderHours(String(config.feedReminderHours));
        setDailySummaryTime(config.dailySummaryTime);
        setLoaded(true);
      })
      .catch(() => setScheduleStatus("加载推送设置失败，请刷新重试"));
  }, []);

  async function saveSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setScheduleStatus("");
    try {
      const response = await fetch("/api/notifications/config", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ feedReminderHours: Number(feedReminderHours), dailySummaryTime }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败，请稍后重试");
      setScheduleStatus("推送时间已保存，待发送提醒已更新");
    } catch (error) {
      setScheduleStatus(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

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

        <form onSubmit={saveSchedule} className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 space-y-4">
          <div className="font-semibold">推送时间</div>
          <fieldset disabled={!loaded || saving} className="space-y-4 disabled:opacity-50">
            <label className="block text-sm">
              喂奶提醒间隔（小时）
              <input type="number" min="0.5" max="24" step="0.5" required value={feedReminderHours}
                onChange={(event) => setFeedReminderHours(event.target.value)}
                className="tap mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3" />
            </label>
            <label className="block text-sm">
              每日统计推送时间
              <input type="time" required value={dailySummaryTime}
                onChange={(event) => setDailySummaryTime(event.target.value)}
                className="tap mt-2 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3" />
            </label>
            <p className="text-xs text-[var(--muted)]">距上次喂奶达到设定间隔后提醒一次。统计时间按服务器时区执行，所有设备共用此设置。</p>
            <button type="submit" className="tap w-full rounded-xl bg-blue-600 text-white">{saving ? "保存中…" : "保存推送时间"}</button>
          </fieldset>
          {scheduleStatus && <p role="status" className="text-sm text-[var(--muted)]">{scheduleStatus}</p>}
        </form>

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
