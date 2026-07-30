const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bkab\.?\b/g, "kabupaten"],
  [/\bkec\.?\b/g, "kecamatan"],
  [/\bkel\.?\b/g, "kelurahan"],
  [/\bds\.?\b/g, "desa"],
  [/\btaput\b/g, "tapanuli utara"],
  [/\btapteng\b/g, "tapanuli tengah"],
  [/\btapsel\b/g, "tapanuli selatan"],
  [/\blabura\b/g, "labuhanbatu utara"],
  [/\blabusel\b/g, "labuhanbatu selatan"],
  [/\bpaluta\b/g, "padang lawas utara"],
  [/\bpalas\b/g, "padang lawas"],
  [/\bsiantar\b/g, "pematangsiantar"],
  [/\bkaban\s+jahe\b/g, "kabanjahe"],
];

const GENERIC_PREFIXES =
  /\b(?:provinsi|kabupaten|kota|kecamatan|kelurahan|desa)\b/g;

export function normalizeRegionName(value: string) {
  let normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  for (const [pattern, replacement] of ABBREVIATIONS)
    normalized = normalized.replace(pattern, replacement);
  return normalized.replace(/\s+/g, " ").trim();
}

export function normalizeRegionKey(value: string) {
  return normalizeRegionName(value)
    .replace(GENERIC_PREFIXES, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function regionAliases(input: {
  regencyName: string;
  districtName: string;
  villageName: string;
}) {
  const aliases = new Set<string>();
  for (const value of [
    input.regencyName,
    input.districtName,
    input.villageName,
  ]) {
    aliases.add(normalizeRegionName(value));
    aliases.add(normalizeRegionKey(value));
  }
  const regency = normalizeRegionKey(input.regencyName);
  const known: Record<string, string[]> = {
    pematangsiantar: ["siantar"],
    "tapanuli utara": ["taput"],
    "tapanuli tengah": ["tapteng"],
    "tapanuli selatan": ["tapsel"],
    "labuhanbatu utara": ["labura"],
    "labuhanbatu selatan": ["labusel"],
    "padang lawas utara": ["paluta"],
    "padang lawas": ["palas"],
  };
  for (const alias of known[regency] ?? []) aliases.add(alias);
  return [...aliases].filter(Boolean);
}

export function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++)
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

export function similarity(left: string, right: string) {
  const a = normalizeRegionKey(left);
  const b = normalizeRegionKey(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a))
    return Math.min(a.length, b.length) / Math.max(a.length, b.length) + 0.15;
  return 1 - levenshteinDistance(a, b) / Math.max(a.length, b.length);
}
