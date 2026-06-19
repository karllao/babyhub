import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

export { dayjs };

export function fmtDateTime(ts: number): string {
  return dayjs(ts).format("MM-DD HH:mm");
}

export function fmtTime(ts: number): string {
  return dayjs(ts).format("HH:mm");
}

export function fmtDay(ts: number): string {
  return dayjs(ts).format("YYYY-MM-DD");
}

export function fmtRelative(ts: number): string {
  return dayjs(ts).fromNow();
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s ? `${m}分${s}秒` : `${m}分`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}小时${mm}分`;
}

export function fmtTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function startOfDayMs(ts: number): number {
  return dayjs(ts).startOf("day").valueOf();
}

export function endOfDayMs(ts: number): number {
  return dayjs(ts).endOf("day").valueOf();
}
