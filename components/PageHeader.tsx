"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({ title, back = "/" }: { title: string; back?: string }) {
  return (
    <header
      className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-12 flex items-center px-2 relative">
        <Link
          href={back}
          className="tap w-10 h-10 flex items-center justify-center -ml-1 text-[var(--fg)]"
          aria-label="返回"
        >
          <ChevronLeft size={26} />
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-lg">{title}</h1>
      </div>
    </header>
  );
}
