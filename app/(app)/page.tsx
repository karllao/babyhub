import QuickActionBar from "@/components/QuickActionBar";
import TodaySummary from "@/components/TodaySummary";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="px-4 pt-4 pb-6 space-y-5 max-w-md mx-auto">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">今日</h1>
        <span className="text-sm text-[var(--muted)]">
          {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}
        </span>
      </header>

      <TodaySummary />

      <section>
        <h2 className="text-sm font-medium text-[var(--muted)] mb-2 px-1">快速记录</h2>
        <QuickActionBar />
      </section>
    </main>
  );
}
