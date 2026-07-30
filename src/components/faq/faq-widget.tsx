"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import type { WeatherResponse } from "@/types/weather";
import type { Earthquake } from "@/types/earthquake";
import type { WarningResponse } from "@/types/warning";
import { processFaqQuestion } from "@/utils/faq";

const weatherSuggestions = [
  "Bagaimana cuaca Medan hari ini?",
  "Berapa suhu saat ini?",
  "Bagaimana kelembapan udara?",
  "Bagaimana kondisi angin?",
];
const outOfScope =
  /\b(gempa|magnitudo|tsunami|peringatan|webgis|dashboard|sistem|bmkg)\b/i;

export function FaqWidget({
  weather,
  latest,
  warning,
  lastUpdated,
}: {
  weather?: WeatherResponse;
  latest?: Earthquake;
  warning?: WarningResponse;
  lastUpdated?: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState(
    "Pilih pertanyaan populer atau ketik pertanyaan singkat.",
  );
  const ask = (question: string) => {
    const clean = question.trim();
    if (!clean) return;
    setAnswer(
      outOfScope.test(clean)
        ? "Asisten ini khusus membantu pertanyaan cuaca. Coba tanyakan kondisi cuaca, suhu, kelembapan, angin, atau prakiraan berikutnya."
        : processFaqQuestion(clean, {
            weather,
            latestEarthquake: latest,
            warning,
            lastUpdated,
          }).answer,
    );
    setInput("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };
  return (
    <>
      <button
        id="faq"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-[1002] inline-flex min-h-12 items-center gap-2 rounded-full bg-[#557a64] px-5 font-semibold text-white shadow-xl hover:bg-[#496b57]"
      >
        <MessageCircleQuestion className="size-5" />
        Buka FAQ
      </button>
      {open && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Asisten Informasi BBMKG"
          className="fixed right-4 bottom-4 z-[1100] flex max-h-[80vh] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-slate-950 p-4 text-white">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#d8eadc] uppercase">
                Asisten Cuaca BBMKG
              </p>
              <h2 className="font-bold">FAQ Cuaca Interaktif</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup FAQ"
              className="grid size-10 place-items-center rounded-lg hover:bg-slate-800"
            >
              <X />
            </button>
          </header>
          <div className="overflow-y-auto p-4">
            <p className="rounded-xl bg-slate-100 p-3 text-sm leading-relaxed">
              {answer}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {weatherSuggestions.map((question) => (
                <button
                  key={question}
                  onClick={() => ask(question)}
                  className="rounded-full border px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50"
                >
                  {question}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-amber-800">
              FAQ ini membantu pengguna membaca informasi yang ditampilkan pada
              dashboard. Informasi ini bukan layanan darurat dan tidak
              menggantikan kanal resmi BMKG atau instruksi pemerintah.
            </p>
          </div>
          <form onSubmit={submit} className="border-t p-3">
            <label htmlFor="faq-widget-input" className="sr-only">
              Pertanyaan FAQ
            </label>
            <div className="flex gap-2">
              <input
                id="faq-widget-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ketik pertanyaan singkat..."
                className="min-w-0 flex-1 rounded-xl border px-3"
              />
              <button
                aria-label="Tanyakan"
                className="grid size-11 place-items-center rounded-xl bg-[#557a64] text-white"
              >
                <Send className="size-4" />
              </button>
            </div>
            <Link
              href="/faq"
              className="mt-3 block text-center text-sm font-bold text-[#496b57]"
            >
              Lihat FAQ Lengkap
            </Link>
          </form>
        </aside>
      )}
    </>
  );
}
