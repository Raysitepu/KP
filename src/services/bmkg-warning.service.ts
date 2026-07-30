import { XMLParser } from "fast-xml-parser";
import type { WarningResponse, WeatherWarning } from "@/types/warning";
import { isAllowedCapUrl, parseCapPolygon } from "@/utils/warning";

const FEED_URL = "https://www.bmkg.go.id/alerts/nowcast/id";
const NONE_MESSAGE =
  "Tidak ada peringatan dini cuaca aktif untuk Sumatera Utara pada feed BMKG saat ini.";
const UNAVAILABLE_MESSAGE =
  "Data peringatan dini BMKG belum dapat dimuat. Silakan coba kembali beberapa saat lagi.";
const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
  removeNSPrefix: true,
});
const asArray = <T>(value: T | T[] | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];
const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : typeof value === "number"
      ? String(value)
      : null;
const asIso = (value: unknown) => {
  const raw = asText(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const normalize = (value: string) =>
  value.toLocaleLowerCase("id-ID").replace(/\s+/g, " ");

type FeedItem = Record<string, unknown>;
type ParsedFeed = { items: FeedItem[]; feedUpdatedAt: string | null };

function parseFeed(xml: string): ParsedFeed {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch {
    throw new Error("invalid-feed");
  }
  const channel = (
    document.rss as { channel?: Record<string, unknown> } | undefined
  )?.channel;
  if (!channel) throw new Error("invalid-feed");
  return {
    items: asArray(channel.item as FeedItem | FeedItem[] | undefined),
    feedUpdatedAt: asIso(channel.lastBuildDate ?? channel.pubDate),
  };
}

function sumutItems(items: FeedItem[]) {
  return items.filter((item) =>
    normalize(
      `${asText(item.title) ?? ""} ${asText(item.description) ?? ""} ${asText(item.link) ?? ""}`,
    ).includes("sumatera utara"),
  );
}

function capUrl(item: FeedItem) {
  const raw = asText(item.link);
  if (!raw) throw new Error("missing-cap-link");
  const url = new URL(raw, "https://www.bmkg.go.id").href;
  if (!isAllowedCapUrl(url)) throw new Error("invalid-cap-link");
  return url;
}

export function parseCapDocument(xml: string): WeatherWarning {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch {
    throw new Error("invalid-cap");
  }
  const alert = document.alert as Record<string, unknown> | undefined;
  if (!alert) throw new Error("invalid-cap");
  const infos = asArray(
    alert.info as
      Record<string, unknown> | Record<string, unknown>[] | undefined,
  );
  const info =
    infos.find((entry) =>
      asText(entry.language)?.toLowerCase().startsWith("id"),
    ) ?? infos[0];
  if (!info) throw new Error("missing-info");
  const areas = asArray(
    info.area as
      Record<string, unknown> | Record<string, unknown>[] | undefined,
  ).map((area) => ({
    description: asText(area.areaDesc),
    polygons: asArray(area.polygon as string | string[] | undefined)
      .map(parseCapPolygon)
      .filter((polygon) => polygon.length >= 3),
  }));
  return {
    identifier: asText(alert.identifier),
    sent: asIso(alert.sent),
    event: asText(info.event),
    urgency: asText(info.urgency),
    severity: asText(info.severity),
    certainty: asText(info.certainty),
    effective: asIso(info.effective),
    expires: asIso(info.expires),
    senderName: asText(info.senderName),
    headline: asText(info.headline),
    description: asText(info.description),
    instruction: asText(info.instruction),
    web: asText(info.web),
    areas,
  };
}

const rank = (value: string | null, order: string[]) => {
  const index = order.findIndex(
    (item) => item.toLowerCase() === value?.toLowerCase(),
  );
  return index < 0 ? order.length : index;
};
export function sortWarnings(warnings: WeatherWarning[]) {
  return [...warnings].sort(
    (a, b) =>
      rank(a.severity, ["Extreme", "Severe", "Moderate", "Minor", "Unknown"]) -
        rank(b.severity, [
          "Extreme",
          "Severe",
          "Moderate",
          "Minor",
          "Unknown",
        ]) ||
      rank(a.urgency, ["Immediate", "Expected", "Future", "Past", "Unknown"]) -
        rank(b.urgency, [
          "Immediate",
          "Expected",
          "Future",
          "Past",
          "Unknown",
        ]) ||
      (a.effective ?? "").localeCompare(b.effective ?? ""),
  );
}

export function deduplicateWarnings(warnings: WeatherWarning[]) {
  const unique = new Map<string, WeatherWarning>();
  for (const warning of warnings) {
    const key = [
      normalize(warning.event ?? warning.headline ?? ""),
      warning.effective ?? "",
      warning.expires ?? "",
      warning.web ?? "",
    ].join("|");
    const current = unique.get(key);
    if (
      !current ||
      (warning.identifier ?? "").localeCompare(current.identifier ?? "") > 0
    )
      unique.set(key, warning);
  }
  return [...unique.values()];
}

export function parseWarningDocuments(
  feedXml: string,
  capXmlByUrl: (url: string) => string | null,
  now = new Date(),
): WarningResponse {
  const checkedAt = now.toISOString();
  const feed = parseFeed(feedXml);
  const items = sumutItems(feed.items);
  const warnings = deduplicateWarnings(
    items.flatMap((item) => {
      const xml = capXmlByUrl(capUrl(item));
      if (!xml) throw new Error("missing-cap");
      const warning = parseCapDocument(xml);
      return warning.expires &&
        new Date(warning.expires).getTime() <= now.getTime()
        ? []
        : [warning];
    }),
  );
  return warnings.length
    ? {
        status: "active",
        province: "Sumatera Utara",
        checkedAt,
        feedUpdatedAt: feed.feedUpdatedAt,
        message: null,
        warnings: sortWarnings(warnings),
      }
    : {
        status: "none",
        province: "Sumatera Utara",
        checkedAt,
        feedUpdatedAt: feed.feedUpdatedAt,
        message: NONE_MESSAGE,
        warnings: [],
      };
}

async function fetchXml(url: string, retry = 0): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/xml, text/xml",
        "User-Agent": "SumutWeatherDashboard/1.0",
      },
      next: { revalidate: 180 },
    });
    if (!response.ok) {
      if (retry < 1 && (response.status === 429 || response.status >= 500))
        return fetchXml(url, retry + 1);
      throw new Error("upstream");
    }
    if (!(response.headers.get("content-type") ?? "").includes("xml"))
      throw new Error("content-type");
    return response.text();
  } catch (error) {
    if (retry < 1 && error instanceof Error && error.name === "AbortError")
      return fetchXml(url, retry + 1);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getWeatherWarning(): Promise<WarningResponse> {
  const checkedAt = new Date().toISOString();
  try {
    const feedXml = await fetchXml(FEED_URL);
    const feed = parseFeed(feedXml);
    const items = sumutItems(feed.items);
    if (!items.length)
      return {
        status: "none",
        province: "Sumatera Utara",
        checkedAt,
        feedUpdatedAt: feed.feedUpdatedAt,
        message: NONE_MESSAGE,
        warnings: [],
      };
    const documents = new Map<string, string>();
    await Promise.all(
      items.map(async (item) => {
        const url = capUrl(item);
        documents.set(url, await fetchXml(url));
      }),
    );
    return parseWarningDocuments(feedXml, (url) => documents.get(url) ?? null);
  } catch {
    return {
      status: "unavailable",
      province: "Sumatera Utara",
      checkedAt,
      feedUpdatedAt: null,
      message: UNAVAILABLE_MESSAGE,
      warnings: [],
    };
  }
}
