import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedCapUrl, parseCapPolygon } from "./warning";
import {
  deduplicateWarnings,
  getWeatherWarning,
  parseWarningDocuments,
} from "@/services/bmkg-warning.service";

const item = (code: string) =>
  `<item><title>Hujan Lebat di Sumatera Utara</title><link>https://www.bmkg.go.id/alerts/nowcast/id/${code}_alert.xml</link><description>Peringatan Sumatera Utara</description></item>`;
const feed = (items = "") =>
  `<?xml version="1.0"?><rss><channel><lastBuildDate>Thu, 16 Jul 2026 07:45:29 +0000</lastBuildDate>${items}</channel></rss>`;
const cap = (
  expires: string,
  headline = "Peringatan Sumatera Utara",
  polygon = "3.5,98.5 3.7,98.5 3.7,98.7 3.5,98.5",
  severity = "Moderate",
) =>
  `<?xml version="1.0"?><alert><identifier>${headline}</identifier><sent>2026-07-16T07:00:00Z</sent><info><language>id-ID</language><event>Hujan Lebat</event><urgency>Immediate</urgency><severity>${severity}</severity><certainty>Likely</certainty><effective>2026-07-16T07:00:00Z</effective><expires>${expires}</expires><senderName>BMKG</senderName><headline>${headline}</headline><description>Hujan lebat.</description><instruction>Waspada.</instruction><web>https://www.bmkg.go.id</web><area><areaDesc>Medan</areaDesc><polygon>${polygon}</polygon></area></info></alert>`;
const now = new Date("2026-07-16T08:00:00Z");

describe("CAP warning", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("mempertahankan urutan latitude longitude", () =>
    expect(parseCapPolygon("3.5,98.5 3.7,98.5 3.5,98.7")[0]).toEqual([
      3.5, 98.5,
    ]));
  it("membuang polygon invalid", () =>
    expect(parseCapPolygon("91,98 3.7,181 x,2")).toEqual([]));
  it("menggabungkan revisi kejadian dan periode yang sama", () => {
    const older = parseWarningDocuments(
      feed(item("a")),
      () => cap("2026-07-16T10:00:00Z", "002"),
      now,
    ).warnings[0];
    const newer = {
      ...older,
      identifier: "003",
      description: "Cakupan terbaru",
    };
    expect(deduplicateWarnings([older, newer])).toEqual([newer]);
  });
  it("menolak URL CAP asing dan path tidak sah", () => {
    expect(
      isAllowedCapUrl("https://www.bmkg.go.id/alerts/nowcast/id/ABC_alert.xml"),
    ).toBe(true);
    expect(
      isAllowedCapUrl("https://evil.test/alerts/nowcast/id/ABC_alert.xml"),
    ).toBe(false);
    expect(isAllowedCapUrl("https://www.bmkg.go.id/cuaca/ABC_alert.xml")).toBe(
      false,
    );
  });
  it("menghasilkan none ketika feed kosong", () =>
    expect(parseWarningDocuments(feed(), () => null, now).status).toBe("none"));
  it("menormalisasi satu warning", () => {
    const result = parseWarningDocuments(
      feed(item("ONE")),
      () => cap("2026-07-16T10:00:00Z"),
      now,
    );
    expect(result.status).toBe("active");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].areas[0].polygons[0][0]).toEqual([3.5, 98.5]);
  });
  it("mendukung dan mengurutkan beberapa warning", () => {
    const docs = new Map([
      [
        "https://www.bmkg.go.id/alerts/nowcast/id/ONE_alert.xml",
        cap("2026-07-16T10:00:00Z", "Moderate", undefined, "Moderate"),
      ],
      [
        "https://www.bmkg.go.id/alerts/nowcast/id/TWO_alert.xml",
        cap("2026-07-16T11:00:00Z", "Severe", undefined, "Severe"),
      ],
    ]);
    const result = parseWarningDocuments(
      feed(item("ONE") + item("TWO")),
      (url) => docs.get(url) ?? null,
      now,
    );
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0].severity).toBe("Severe");
  });
  it("menghapus warning kedaluwarsa", () => {
    const result = parseWarningDocuments(
      feed(item("OLD") + item("NEW")),
      (url) =>
        url.includes("OLD")
          ? cap("2026-07-16T07:30:00Z")
          : cap("2026-07-16T10:00:00Z"),
      now,
    );
    expect(result.warnings).toHaveLength(1);
  });
  it("menolak XML rusak", () =>
    expect(() => parseWarningDocuments("<rss>", () => null, now)).toThrow());
  it("menghasilkan unavailable ketika feed gagal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await getWeatherWarning()).status).toBe("unavailable");
  });
});
