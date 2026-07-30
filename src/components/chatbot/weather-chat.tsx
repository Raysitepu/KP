"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  CloudSun,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { WeatherChatMessage, WeatherChatResponse } from "@/types/chatbot";
import type { RegionCandidate } from "@/types/regions";
import type { Region } from "@/types/weather";
import { useActiveRegion } from "@/hooks/use-active-region";
import { ChatMessage } from "./chat-message";

const SESSION_KEY = "bbmkg:dynamic-weather-chat";
const CONVERSATION_KEY = "bbmkg:weather-conversation-id";
const quickQuestions = [
  "Cuaca hari ini",
  "Cuaca besok",
  "Potensi hujan",
  "Peringatan dini",
  "Kecepatan angin",
];
const welcome: WeatherChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Halo! Sebutkan daerah yang ingin diperiksa. Saya akan mencari kode wilayahnya dan mengambil prakiraan terbaru langsung melalui server dari BMKG.",
};

function newConversationId() {
  return crypto.randomUUID();
}

function isSelectionMessage(message: string) {
  return (
    message.startsWith("Gunakan lokasi:") ||
    message.startsWith("Pilih kecamatan:") ||
    message.startsWith("Lihat ringkasan:")
  );
}

function toChatRegion(region: Region): RegionCandidate {
  return {
    provinceCode: region.provinceCode,
    provinceName: region.province,
    regencyCode: region.regencyCode,
    regencyName: region.regency,
    districtCode: region.districtCode,
    districtName: region.district,
    villageCode: region.adm4,
    villageName: region.village,
    adm1: region.provinceCode,
    adm2: region.regencyCode,
    adm3: region.districtCode,
    adm4: region.adm4,
    latitude: region.latitude,
    longitude: region.longitude,
    timezone: region.timezone,
    normalizedName: region.searchText,
    aliases: [region.village],
    level: "village",
    label: region.label,
    score: 1,
    matchedBy: "context",
  };
}

export function WeatherChat({ fullscreen = false }: { fullscreen?: boolean }) {
  const { region: appRegion } = useActiveRegion();
  const fallbackRegion = toChatRegion(appRegion);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<WeatherChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedId = sessionStorage.getItem(CONVERSATION_KEY);
        const id = storedId || newConversationId();
        setConversationId(id);
        sessionStorage.setItem(CONVERSATION_KEY, id);
        const history = sessionStorage.getItem(SESSION_KEY);
        if (history) {
          const storedMessages = JSON.parse(history) as WeatherChatMessage[];
          setMessages(storedMessages);
          const requiresSelection = [...storedMessages]
            .reverse()
            .find((message) => message.role === "assistant")
            ?.response?.requiresLocationSelection;
          if (requiresSelection) {
            setPendingMessage(
              [...storedMessages]
                .reverse()
                .find(
                  (message) =>
                    message.role === "user" &&
                    !isSelectionMessage(message.text),
                )?.text ?? null,
            );
          }
        }
      } catch {
        setConversationId(newConversationId());
      }
    });
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, conversationId]);

  const ask = async (
    question: string,
    selectedRegion?: RegionCandidate,
    selecting = false,
  ) => {
    const clean = question.trim();
    if (!clean || loading) return;
    const id = conversationId || newConversationId();
    if (!conversationId) setConversationId(id);
    const userMessage: WeatherChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: selecting
        ? selectedRegion?.level === "regency"
          ? `Lihat ringkasan: ${selectedRegion.regencyName}`
          : selectedRegion?.level === "district"
            ? `Pilih kecamatan: ${selectedRegion.districtName}`
            : `Gunakan lokasi: ${selectedRegion?.label ?? "lokasi terpilih"}`
        : clean,
    };
    setMessages((items) => [...items, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const request = await fetch("/api/chat/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          conversationId: id,
          selectedRegion: selectedRegion ?? null,
          fallbackRegion,
        }),
      });
      const body = (await request.json()) as Partial<WeatherChatResponse>;
      const result: WeatherChatResponse = {
        success: body.success ?? false,
        conversationId: body.conversationId ?? id,
        intent: body.intent ?? "unknown",
        location: body.location ?? null,
        answer:
          body.answer ??
          "Respons server belum dapat dibaca. Silakan coba kembali.",
        forecast: body.forecast ?? [],
        alerts: body.alerts ?? [],
        suggestions: body.suggestions ?? [],
        regionalSummary: body.regionalSummary ?? null,
        requiresLocationSelection: body.requiresLocationSelection,
        candidates: body.candidates ?? [],
        errorCode: body.errorCode,
      };
      setConversationId(result.conversationId);
      sessionStorage.setItem(CONVERSATION_KEY, result.conversationId);
      setPendingMessage(result.requiresLocationSelection ? clean : null);
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.answer,
          response: result,
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Koneksi ke layanan chatbot bermasalah. Periksa internet lalu coba kembali.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chooseRegion = (candidate: RegionCandidate) => {
    const originalQuestion =
      pendingMessage ??
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "user" && !isSelectionMessage(message.text),
        )?.text;
    if (!originalQuestion) return;
    void ask(originalQuestion, candidate, true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  const clear = () => {
    const id = newConversationId();
    setConversationId(id);
    setMessages([welcome]);
    setPendingMessage(null);
    sessionStorage.setItem(CONVERSATION_KEY, id);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const activeLocation =
    [...messages].reverse().find((message) => message.response?.location)
      ?.response?.location ?? fallbackRegion;

  return (
    <div
      className={`flex w-full min-w-0 flex-col overflow-hidden bg-white ${
        fullscreen
          ? "h-full"
          : "mx-auto min-h-[calc(100vh-11rem)] max-w-6xl rounded-2xl border border-slate-200 shadow-sm"
      }`}
    >
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#194f88] via-[#2579a7] to-[#3d8b78] px-5 py-5 text-white md:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-white/15">
            <MessageCircle className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-black">Asisten Cuaca Dinamis</h2>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-sky-100">
              <span className="size-2 rounded-full bg-emerald-300" />
              Data wilayah dan prakiraan BMKG melalui server
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-emerald-100">
          <p className="font-bold">
            {activeLocation
              ? activeLocation.level === "regency"
                ? activeLocation.regencyName
                : activeLocation.villageName
              : "Belum ada wilayah aktif"}
          </p>
          {activeLocation && (
            <p>
              {activeLocation.level === "regency"
                ? "Ringkasan umum"
                : activeLocation.districtName}
            </p>
          )}
        </div>
      </header>

      <div
        className="min-w-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-4 md:p-7"
        aria-live="polite"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            loading={loading}
            onSelectRegion={chooseRegion}
          />
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="grid size-9 place-items-center rounded-full bg-[#1d5fa3] text-white">
              <CloudSun className="size-4" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm">
              <LoaderCircle className="size-4 animate-spin" />
              Mencari wilayah dan mengambil data BMKG…
            </span>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="min-w-0 border-t border-slate-200 bg-white p-4 md:p-5">
        <div className="mb-4 min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Sparkles className="size-4 text-[#55a47a]" />
              Pertanyaan cepat
            </p>
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600"
            >
              <Trash2 className="size-3.5" />
              Percakapan baru
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                disabled={loading}
                onClick={() => void ask(question)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-bold text-[#1d5fa3] transition hover:border-[#55a47a] hover:bg-emerald-50 disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2"
        >
          <label htmlFor="weather-chat-input" className="sr-only">
            Tulis pertanyaan cuaca
          </label>
          <input
            id="weather-chat-input"
            value={input}
            maxLength={500}
            disabled={loading}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Contoh: Apakah malam ini hujan di Berastagi?"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-100 px-4 outline-none focus:border-[#2d6f9f] focus:bg-white disabled:opacity-60"
          />
          <button
            disabled={!input.trim() || loading}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#1d5fa3] px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Prakiraan bukan jaminan keselamatan. Selalu ikuti kanal resmi BMKG dan
          arahan pihak berwenang.
        </p>
      </div>
    </div>
  );
}
