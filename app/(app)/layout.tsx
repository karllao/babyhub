import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div
        className="min-h-[100dvh] pb-24"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {children}
      </div>
      <BottomNav />
    </ToastProvider>
  );
}
