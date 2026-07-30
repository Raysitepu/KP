import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CloudSun,
  Database,
  Map,
  MessageCircleQuestion,
  Satellite,
  ShieldAlert,
  Waves,
} from "lucide-react";
import regionDataset from "@/data/sumut-regions.json";
import type { RegionDataset } from "@/types/weather";

const dataset = regionDataset as RegionDataset;
const features = [
  {
    icon: CloudSun,
    title: "Prakiraan Cuaca",
    description:
      "Prakiraan resmi BMKG hingga tingkat desa dan kelurahan dengan grafik serta rincian waktu.",
    tone: "from-emerald-500 to-green-700",
  },
  {
    icon: Map,
    title: "Peta WebGIS",
    description:
      "Basemap dan layer interaktif untuk lokasi cuaca, episenter gempa, serta polygon peringatan.",
    tone: "from-teal-500 to-emerald-600",
  },
  {
    icon: Activity,
    title: "Informasi Gempa",
    description:
      "Feed gempa terbaru, M5+, dan dirasakan dengan filter radius serta magnitudo.",
    tone: "from-orange-500 to-red-600",
  },
  {
    icon: ShieldAlert,
    title: "Peringatan Dini",
    description:
      "Peringatan nowcast dan CAP BMKG aktif tanpa membuat kesimpulan keselamatan sendiri.",
    tone: "from-amber-500 to-orange-600",
  },
  {
    icon: MessageCircleQuestion,
    title: "FAQ Interaktif",
    description:
      "Asisten informasi deterministik untuk memahami cuaca, gempa, peringatan, dan WebGIS.",
    tone: "from-violet-500 to-indigo-600",
  },
  {
    icon: Database,
    title: "Data Terverifikasi",
    description:
      "Service layer memvalidasi dan menormalisasi data eksternal sebelum ditampilkan.",
    tone: "from-stone-500 to-stone-700",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3f6fa] text-[#15324b]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#102b46]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#55a47a] to-[#2d6f9f] shadow-lg shadow-black/20">
              <Satellite className="size-5" />
            </span>
            <span>
              <strong className="block text-sm">BBMKG Wilayah I Medan</strong>
              <span className="block text-[11px] text-[#d8eadc]">
                Monitoring Cuaca &amp; Gempa
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/faq"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 sm:block"
            >
              FAQ Interaktif
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#245f8d] transition hover:bg-emerald-50"
            >
              Buka Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#102b46] via-[#245f8d] to-[#438db5] px-5 pt-36 pb-20 text-white md:px-8 md:pt-40 md:pb-28">
        <div className="landing-grid absolute inset-0 opacity-20" />
        <div className="absolute top-20 -left-32 size-96 rounded-full bg-[#55a47a]/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#edf5ef]">
              <span className="size-2 rounded-full bg-emerald-400" />
              Data resmi BMKG • Prototype Kerja Praktik
            </div>
            <p className="mb-3 text-sm font-bold tracking-[.18em] text-[#d8eadc] uppercase">
              WebGIS Sumatera Utara
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.12] font-black tracking-tight md:text-5xl xl:text-6xl">
              Dashboard Monitoring{" "}
              <span className="bg-gradient-to-r from-sky-200 to-emerald-200 bg-clip-text text-transparent">
                Cuaca dan Gempa
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#edf5ef] md:text-lg">
              Visualisasi prakiraan cuaca, informasi gempa bumi, dan peringatan
              dini berbasis WebGIS untuk Sumatera Utara—menggunakan data nyata
              tanpa statistik simulasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-bold text-[#245f8d] shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Lihat Dashboard <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 font-bold text-white transition hover:bg-white/20"
              >
                <MessageCircleQuestion className="size-4" />
                Buka FAQ Interaktif
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3 border-t border-white/15 pt-7">
              {[
                [dataset.regencies.length, "Kab/Kota"],
                [dataset.districts.length, "Kecamatan"],
                [
                  dataset.villages.length.toLocaleString("id-ID"),
                  "Desa/Kelurahan",
                ],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-black md:text-3xl">{value}</p>
                  <p className="mt-1 text-[11px] text-[#d8eadc] md:text-xs">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/25 backdrop-blur-md">
              <div className="overflow-hidden rounded-2xl bg-[#102b46]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold text-[#d8eadc]">
                      CAKUPAN SISTEM
                    </p>
                    <h2 className="mt-1 font-bold">Sumatera Utara</h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    Sistem aktif
                  </span>
                </div>
                <div className="landing-map relative h-[330px] p-6">
                  <div className="absolute inset-x-8 top-7 rounded-2xl border border-[#d8eadc]/20 bg-[#102b46]/70 p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-[#91aa96]/20 text-[#d8eadc]">
                        <Map className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs text-[#d8eadc]">
                          WebGIS interaktif
                        </p>
                        <p className="font-bold">Cuaca • Gempa • Peringatan</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-x-8 bottom-7 grid grid-cols-2 gap-3">
                    {[
                      [CloudSun, "Prakiraan per wilayah"],
                      [Activity, "Feed gempa BMKG"],
                      [ShieldAlert, "CAP peringatan aktif"],
                      [MessageCircleQuestion, "FAQ kontekstual"],
                    ].map(([Icon, label]) => (
                      <div
                        key={label as string}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-[#edf5ef]"
                      >
                        <Icon className="size-4 text-[#d8eadc]" />
                        {label as string}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3 text-[11px] text-[#d8eadc]">
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-[#91aa96]" />
                    Cuaca
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-red-400" />
                    Gempa
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-orange-400" />
                    Peringatan
                  </span>
                  <span className="ml-auto">Sumber: BMKG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="eyebrow">Fitur utama sistem</p>
            <h2 className="text-3xl font-black tracking-tight">
              Informasi BMKG dalam satu dashboard
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Konsep visual dari prototype desain dipadukan dengan arsitektur,
              validasi, dan sumber data nyata aplikasi utama.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, tone }) => (
              <article
                key={title}
                className="group rounded-2xl border border-[#496b57]/15 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-lg`}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-[#245f8d] to-[#55a47a] p-8 text-center text-white shadow-2xl shadow-slate-400/20 md:p-12">
          <h2 className="text-2xl font-black md:text-3xl">
            Mulai eksplorasi data BMKG
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#edf5ef]">
            Prakiraan merupakan informasi untuk waktu mendatang dan tidak
            menggantikan kanal resmi BMKG atau instruksi pihak berwenang.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-6 py-3 font-bold text-[#245f8d]"
            >
              Dashboard Utama
            </Link>
            <Link
              href="/webgis"
              className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-bold"
            >
              Buka Peta WebGIS
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#496b57]/15 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#55a47a] to-[#2d6f9f] text-white">
              <Satellite className="size-4" />
            </span>
            <span>BBMKG Wilayah I Medan • Prototype Kerja Praktik</span>
          </div>
          <p className="flex items-center gap-2">
            <Waves className="size-4" />
            Data resmi BMKG, disajikan kembali secara informatif
          </p>
        </div>
      </footer>
    </main>
  );
}
