import type { NormalizedForecast } from "@/types/weather";

export const ADM4_REGEX = /^12\.\d{2}\.\d{2}\.\d{4}$/;
export const isValidSumutAdm4 = (value: string) => ADM4_REGEX.test(value);

export function flattenForecasts(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    Array.isArray(item) ? flattenForecasts(item) : [item],
  );
}

export function groupForecasts(items: NormalizedForecast[]) {
  return items.reduce<Record<string, NormalizedForecast[]>>((result, item) => {
    (result[item.date] ??= []).push(item);
    return result;
  }, {});
}

export function selectCurrentForecast(
  items: NormalizedForecast[],
  now = new Date(),
) {
  if (!items.length) return null;
  return (
    items.find((item) => new Date(item.datetime).getTime() >= now.getTime()) ??
    items.at(-1) ??
    null
  );
}

export function formatWib(value: string, options?: Intl.DateTimeFormatOptions) {
  const parsed = new Date(
    value.replace(" ", "T") +
      (value.includes("+") || value.endsWith("Z") ? "" : "+07:00"),
  );
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    ...options,
  }).format(parsed);
}
