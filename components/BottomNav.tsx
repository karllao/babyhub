"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, BarChart3, Settings } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/history", label: "历史", icon: Clock },
  { href: "/stats", label: "统计", icon: BarChart3 },
  { href: "/settings", label: "设置", icon: Settings },
];

// 仅在顶层 Tab 页显示;详情/编辑/计时页隐藏,避免遮挡底部保存按钮
const TOP_LEVEL = new Set(["/", "/history", "/stats", "/settings"]);

export default function BottomNav() {
  const pathname = usePathname() || "/";
  if (!TOP_LEVEL.has(pathname)) return null;
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[var(--card)] border-t border-[var(--border)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "tap flex flex-col items-center justify-center gap-0.5 py-2 text-xs",
                  active ? "text-brand-500" : "text-[var(--muted)]"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
