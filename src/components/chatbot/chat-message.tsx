import Link from "next/link";
import { Bot, Map, ShieldAlert, UserRound } from "lucide-react";
import type { RegionCandidate } from "@/types/regions";
import type { WeatherChatMessage } from "@/types/chatbot";
import { ForecastCard } from "./forecast-card";
import { AlertCard } from "./alert-card";
import { RegionCandidates } from "./region-candidates";
import { RegionalSummaryCard } from "./regional-summary-card";

export function ChatMessage({
  message,
  loading,
  onSelectRegion,
}: {
  message: WeatherChatMessage;
  loading: boolean;
  onSelectRegion: (candidate: RegionCandidate) => void;
}) {
  const assistant = message.role === "assistant";
  return (
    <div
      className={`flex min-w-0 gap-3 ${assistant ? "justify-start" : "justify-end"}`}
    >
      {assistant && (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1d5fa3] text-white">
          <Bot className="size-4" />
        </span>
      )}
      <div
        className={`max-w-[calc(100%_-_3rem)] min-w-0 overflow-hidden rounded-2xl p-4 text-sm leading-relaxed break-words shadow-sm md:max-w-[82%] ${
          assistant
            ? "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
            : "rounded-br-sm bg-[#1d5fa3] text-white"
        }`}
      >
        <p className="whitespace-pre-line">{message.text}</p>
        {assistant && message.response?.location && (
          <ForecastCard
            location={message.response.location}
            forecasts={message.response.forecast}
          />
        )}
        {assistant && message.response?.alerts && (
          <AlertCard
            alerts={message.response.alerts}
            timezone={message.response.location?.timezone ?? "Asia/Jakarta"}
          />
        )}
        {assistant && message.response?.regionalSummary ? (
          <RegionalSummaryCard summary={message.response.regionalSummary} />
        ) : null}
        {assistant && message.response?.candidates?.length ? (
          <RegionCandidates
            candidates={message.response.candidates}
            disabled={loading}
            onSelect={onSelectRegion}
          />
        ) : null}
        {assistant && message.response && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {message.response.location && (
              <Link
                href="/webgis"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-50 px-3 text-xs font-bold text-sky-800 transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              >
                <Map className="size-4" aria-hidden="true" />
                Lihat di peta
              </Link>
            )}
            {(message.response.alerts?.length ||
              message.response.intent === "weather_warning") && (
              <Link
                href="/peringatan"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-50 px-3 text-xs font-bold text-orange-800 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
              >
                <ShieldAlert className="size-4" aria-hidden="true" />
                Lihat peringatan
              </Link>
            )}
          </div>
        )}
      </div>
      {!assistant && (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#55a47a] text-white">
          <UserRound className="size-4" />
        </span>
      )}
    </div>
  );
}
