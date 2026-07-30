import { z } from "zod";

const nullableCoordinate = z.number().finite().nullable();

export const selectedRegionSchema = z.object({
  provinceCode: z.string().min(1).max(10),
  provinceName: z.string().min(1).max(100),
  regencyCode: z.string().min(1).max(20),
  regencyName: z.string().min(1).max(100),
  districtCode: z.string().min(1).max(20),
  districtName: z.string().min(1).max(100),
  villageCode: z.string().min(1).max(30),
  villageName: z.string().min(1).max(100),
  adm1: z.string().min(1).max(10),
  adm2: z.string().min(1).max(20),
  adm3: z.string().min(1).max(20),
  adm4: z.string().regex(/^12\.\d{2}\.\d{2}\.\d{4}$/),
  latitude: nullableCoordinate,
  longitude: nullableCoordinate,
  timezone: z.string().min(1).max(80),
  normalizedName: z.string().max(400),
  aliases: z.array(z.string().max(100)).max(30),
  level: z
    .enum(["province", "regency", "district", "village"])
    .default("village"),
});

export const weatherChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Pertanyaan tidak boleh kosong.")
    .max(500, "Pertanyaan terlalu panjang."),
  conversationId: z.string().uuid().optional(),
  selectedRegion: selectedRegionSchema.nullable().optional(),
  fallbackRegion: selectedRegionSchema.nullable().optional(),
});

export const regionSearchQuerySchema = z.string().trim().min(2).max(100);

export function sanitizeMessage(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
