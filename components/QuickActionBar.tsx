"use client";

import Link from "next/link";
import { Baby, Milk, Droplets, GlassWater, Waves } from "lucide-react";

const actions = [
  {
    href: "/feed?type=bottle&content=formula",
    label: "瓶喂奶粉",
    icon: GlassWater,
    cls: "bg-amber-500",
    emoji: "🥛",
  },
  {
    href: "/feed?type=bottle&content=breastmilk",
    label: "瓶喂母乳",
    icon: Milk,
    cls: "bg-rose-500",
    emoji: "🍼",
  },
  {
    href: "/feed?type=breast",
    label: "亲喂",
    icon: Baby,
    cls: "bg-pink-500",
    emoji: "🤱",
  },
  {
    href: "/diaper",
    label: "换尿布",
    icon: Droplets,
    cls: "bg-sky-500",
    emoji: "💩",
  },
  {
    href: "/pump",
    label: "吸奶",
    icon: Waves,
    cls: "bg-violet-500",
    emoji: "🥤",
  },
];

export default function QuickActionBar() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className={`tap flex flex-col items-center justify-center gap-1 rounded-2xl ${a.cls} text-white py-6 shadow-md active:scale-[0.98] transition-transform`}
        >
          <span className="text-3xl leading-none">{a.emoji}</span>
          <span className="text-base font-semibold">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
