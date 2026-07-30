import { z } from "zod";

export const rawForecastSchema = z
  .object({
    local_datetime: z.string(),
    utc_datetime: z.string().optional(),
    t: z.coerce.number().nullable().optional(),
    hu: z.coerce.number().nullable().optional(),
    weather_desc: z.string().optional().default("Tidak tersedia"),
    weather_desc_en: z.string().nullable().optional(),
    ws: z.coerce.number().nullable().optional(),
    wd: z.string().nullable().optional(),
    tcc: z.coerce.number().nullable().optional(),
    vs_text: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    analysis_date: z.string().nullable().optional(),
  })
  .passthrough();

export const bmkgWeatherSchema = z
  .object({
    lokasi: z
      .object({
        provinsi: z.string().optional(),
        kotkab: z.string().optional(),
        kecamatan: z.string().optional(),
        desa: z.string().optional(),
        lat: z.coerce.number().nullable().optional(),
        lon: z.coerce.number().nullable().optional(),
        timezone: z.string().optional(),
        adm4: z.string().optional(),
      })
      .passthrough(),
    data: z.array(z.object({ cuaca: z.unknown() }).passthrough()).min(1),
  })
  .passthrough();

export const rawEarthquakeSchema = z
  .object({
    Tanggal: z.string().default("-"),
    Jam: z.string().default("-"),
    DateTime: z.string().optional(),
    Coordinates: z.string().optional(),
    Magnitude: z.union([z.string(), z.number()]).optional(),
    Kedalaman: z.string().default("-"),
    Wilayah: z.string().default("Tidak tersedia"),
    Potensi: z.string().default("Tidak tersedia"),
    Dirasakan: z.string().optional(),
    Shakemap: z.string().optional(),
  })
  .passthrough();
