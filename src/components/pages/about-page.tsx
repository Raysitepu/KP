import {
  Activity,
  BookOpen,
  CloudSun,
  Database,
  Map,
  MessageCircleQuestion,
  Satellite,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import regionDataset from "@/data/sumut-regions.json";
import type { RegionDataset } from "@/types/weather";
import { Card } from "@/components/ui/card";

const dataset = regionDataset as RegionDataset;

export function AboutPage() {
  return (
    <div className="mx-auto max-w-[1320px] space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173e64] via-[#246895] to-[#3d8b78] p-7 text-white shadow-xl md:p-10">
        <div className="landing-grid absolute inset-0 opacity-15" />
        <div className="relative flex max-w-4xl items-start gap-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/12">
            <Satellite className="size-8" />
          </span>
          <div>
            <p className="text-xs font-extrabold tracking-[.15em] text-emerald-200 uppercase">
              Prototype Kerja Praktik 2026
            </p>
            <h2 className="mt-2 text-2xl leading-tight font-black md:text-3xl">
              Dashboard Monitoring Cuaca dan Gempa Bumi Berbasis WebGIS
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-100 md:text-base">
              Sistem informasi untuk menyajikan kembali data publik BMKG bagi
              wilayah Sumatera Utara dengan navigasi yang lebih terstruktur.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-extrabold">Perhatian — sistem prototype</h2>
            <p className="mt-1 text-sm leading-relaxed">
              Aplikasi ini bukan pengganti kanal resmi BMKG dan bukan layanan
              darurat. Ikuti informasi resmi BMKG serta instruksi pemerintah
              atau pihak berwenang untuk keputusan keselamatan.
            </p>
          </div>
        </div>
      </section>

      <Card>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-[#2d6f9f]" />
          <h2 className="section-title">Tujuan sistem</h2>
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600">
          Sistem dirancang untuk membantu masyarakat membaca prakiraan cuaca,
          informasi gempa bumi, dan peringatan dini dalam satu antarmuka yang
          konsisten dan mudah ditelusuri.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [CloudSun, "Prakiraan cuaca per wilayah"],
            [Map, "Peta WebGIS interaktif"],
            [Activity, "Informasi gempa BMKG"],
            [ShieldAlert, "Peringatan dini aktif"],
            [MessageCircleQuestion, "FAQ khusus informasi cuaca"],
            [ShieldCheck, "Validasi data sebelum ditampilkan"],
          ].map(([Icon, label]) => (
            <div
              key={label as string}
              className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold"
            >
              <Icon className="size-5 shrink-0 text-[#55a47a]" />
              {label as string}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Database className="size-5 text-[#2d6f9f]" />
          <h2 className="section-title">Sumber dan cakupan data</h2>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[
            ["Prakiraan cuaca", "Layanan publik prakiraan cuaca BMKG."],
            ["Informasi gempa", "Feed gempa terbaru, M5+, dan dirasakan BMKG."],
            ["Peringatan dini", "Feed nowcast/CAP BMKG untuk Sumatera Utara."],
            [
              "Dataset wilayah",
              `${dataset.regencies.length} kabupaten/kota, ${dataset.districts.length} kecamatan, dan ${dataset.villages.length.toLocaleString("id-ID")} desa/kelurahan.`,
            ],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 p-4"
            >
              <h3 className="font-extrabold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </article>
          ))}
        </div>
        <a
          href="https://www.bmkg.go.id"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#1d5fa3] px-5 text-sm font-bold text-white"
        >
          Buka kanal resmi BMKG
        </a>
      </Card>
    </div>
  );
}
