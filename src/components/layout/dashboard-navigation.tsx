"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CloudSun,
  Gauge,
  Info,
  Map,
  MessageCircleQuestion,
  Waves,
} from "lucide-react";

const items = [
  ["overview", "Ringkasan", Gauge],
  ["prakiraan", "Prakiraan", CloudSun],
  ["peta", "Peta WebGIS", Map],
  ["peringatan", "Peringatan", AlertTriangle],
  ["gempa", "Gempa", Waves],
  ["faq", "FAQ Interaktif", MessageCircleQuestion],
  ["tentang", "Tentang", Info],
] as const;

export function DashboardNavigation() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const sections = items
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65%", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <nav
      aria-label="Navigasi dashboard"
      className="sticky top-0 z-[900] border-b border-[#496b57]/15 bg-white/95 shadow-sm backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-2 md:px-8">
        {items.map(([id, label, Icon]) => (
          <a
            key={id}
            href={id === "faq" ? "/faq" : `#${id}`}
            aria-current={active === id ? "location" : undefined}
            className={`group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${active === id ? "bg-[#2d6f9f] text-white shadow-md shadow-slate-500/15" : "text-slate-500 hover:bg-emerald-50 hover:text-[#3f7f61]"}`}
          >
            <Icon className="size-4" />
            {label}
            {active === id && (
              <span className="size-1.5 rounded-full bg-[#f2c3a9]" />
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
