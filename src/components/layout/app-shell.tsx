"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ChevronLeft,
  CloudSun,
  Home,
  Info,
  Map,
  Menu,
  MessageCircleQuestion,
  PanelLeftClose,
  PanelLeftOpen,
  Satellite,
  ShieldAlert,
  X,
} from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Ringkasan", icon: Home },
  { href: "/webgis", label: "Peta WebGIS", icon: Map },
  { href: "/prakiraan", label: "Prakiraan Cuaca", icon: CloudSun },
  { href: "/gempa", label: "Gempa Bumi", icon: Activity },
  { href: "/peringatan", label: "Peringatan Dini", icon: ShieldAlert },
  { href: "/faq", label: "FAQ Interaktif", icon: MessageCircleQuestion },
  { href: "/tentang", label: "Tentang Sistem", icon: Info },
] as const;

const pageDetails: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Ringkasan",
    description: "Ikhtisar cuaca, gempa, dan peringatan dini",
  },
  "/webgis": {
    title: "Peta WebGIS Interaktif",
    description: "Layer cuaca, episenter, dan peringatan BMKG",
  },
  "/prakiraan": {
    title: "Prakiraan Cuaca",
    description: "Prakiraan per wilayah hingga tingkat desa",
  },
  "/gempa": {
    title: "Data Gempa Bumi",
    description: "Informasi gempa terbaru dari BMKG",
  },
  "/peringatan": {
    title: "Peringatan Dini",
    description: "Peringatan aktif untuk Sumatera Utara",
  },
  "/faq": {
    title: "Asisten Cuaca",
    description: "Tanya jawab cepat mengenai cuaca",
  },
  "/tentang": {
    title: "Tentang Sistem",
    description: "Sumber data, tujuan, dan batasan aplikasi",
  },
};

function NavigationItems({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navigasi utama" className="space-y-1.5 px-3">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-12 items-center rounded-xl border px-3 transition ${
              collapsed ? "justify-center" : "gap-3"
            } ${
              active
                ? "border-sky-400/40 bg-[#1d5fa3] text-white shadow-lg shadow-black/10"
                : "border-transparent text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon
              className={`size-5 shrink-0 ${active ? "text-emerald-300" : "text-slate-400 group-hover:text-emerald-300"}`}
            />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {label}
                </span>
                {active && (
                  <span className="size-2 rounded-full bg-emerald-400" />
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  fullscreen = false,
}: {
  children: React.ReactNode;
  fullscreen?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const details = pageDetails[pathname] ?? pageDetails["/dashboard"];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#eef3f8] text-[#15324b]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-[#102b46] text-white transition-[width] duration-300 md:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <Link
          href="/"
          className={`flex h-20 shrink-0 items-center border-b border-white/10 px-4 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2d6f9f] to-[#55a47a] shadow-lg shadow-black/20">
            <Satellite className="size-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <strong className="block truncate text-base">BBMKG</strong>
              <span className="block truncate text-xs font-semibold text-emerald-300">
                Wilayah I Medan
              </span>
            </span>
          )}
        </Link>

        <div className="flex-1 overflow-y-auto py-5">
          <NavigationItems pathname={pathname} collapsed={collapsed} />
        </div>

        <div className="border-t border-white/10 p-4">
          <div
            className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
            title="Sistem terhubung"
          >
            <span className="size-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.12)]" />
            {!collapsed && (
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Sistem aktif
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Sumber data BMKG
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-[#102b46] text-white shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#2d6f9f] to-[#55a47a]">
                  <Satellite className="size-5" />
                </span>
                <span>
                  <strong className="block">BBMKG</strong>
                  <span className="text-xs text-emerald-300">
                    Wilayah I Medan
                  </span>
                </span>
              </Link>
              <button
                aria-label="Tutup menu"
                onClick={() => setMobileOpen(false)}
                className="grid size-10 place-items-center rounded-xl bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-5">
              <NavigationItems
                pathname={pathname}
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      <div
        className={`min-h-screen max-w-full min-w-0 transition-[padding] duration-300 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 flex min-h-20 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl md:px-6">
          <button
            aria-label="Buka menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 md:hidden"
          >
            <Menu className="size-5" />
          </button>
          <button
            aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            className="hidden size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-[#2d6f9f] hover:text-[#2d6f9f] md:grid"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg">
              {details.title}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              {details.description}
            </p>
          </div>
          <Link
            href="/"
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-[#55a47a] hover:text-[#2d6f9f] sm:inline-flex"
          >
            <ChevronLeft className="size-4" />
            Landing page
          </Link>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2d6f9f] to-[#55a47a] text-sm font-black text-white">
            B
          </span>
        </header>

        <main
          id="main-content"
          className={
            fullscreen
              ? "h-[calc(100vh-5rem)] max-w-full min-w-0 overflow-y-auto"
              : "min-h-[calc(100vh-8rem)] max-w-full min-w-0 p-4 md:p-6"
          }
        >
          {children}
        </main>

        {!fullscreen && (
          <footer className="flex min-h-16 flex-col items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:flex-row sm:text-left md:px-6">
            <span>BBMKG Wilayah I Medan © 2026 · Prototype Kerja Praktik</span>
            <span>Data disajikan kembali dari layanan publik BMKG</span>
          </footer>
        )}
      </div>
    </div>
  );
}
