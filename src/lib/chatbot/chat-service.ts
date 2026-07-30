import "server-only";

import type {
  ConversationState,
  ParsedWeatherIntent,
  WeatherChatRequest,
  WeatherChatResponse,
  WeatherIntent,
} from "@/types/chatbot";
import type { RegionCandidate } from "@/types/regions";
import { ServiceError } from "@/services/fetch-json";
import {
  filterAlertsForRegion,
  getCachedAlerts,
} from "@/lib/bmkg/alert-service";
import { getCachedWeather } from "@/lib/bmkg/weather-service";
import {
  getRegionByAdm4,
  getRepresentativeRegionsForRegency,
  getVillageCandidatesForDistrict,
  resolveLocation,
} from "@/lib/regions/region-service";
import {
  createConversationId,
  getConversationState,
  saveConversationState,
} from "./conversation-state";
import { extractComparisonParts, parseWeatherIntent } from "./intent-parser";
import { primaryForecast, selectForecasts } from "./forecast-selector";
import {
  generateComparisonAnswer,
  generateWarningAnswer,
  generateWeatherAnswer,
} from "./response-generator";
import { answerStaticFaq, isStaticFaqQuestion } from "./static-faq";
import {
  buildRegionalWeatherSummary,
  generateRegionalWeatherAnswer,
} from "./regional-summary";

const dynamicSuggestions = [
  "Bagaimana cuaca hari ini?",
  "Apakah besok pagi hujan?",
  "Bagaimana kecepatan anginnya?",
  "Apakah ada peringatan dini?",
];

function response(
  conversationId: string,
  input: Partial<WeatherChatResponse>,
): WeatherChatResponse {
  return {
    success: false,
    conversationId,
    intent: "unknown",
    location: null,
    answer: "Permintaan belum dapat diproses.",
    forecast: [],
    alerts: [],
    suggestions: dynamicSuggestions,
    regionalSummary: null,
    ...input,
  };
}

function nextState(
  conversationId: string,
  previous: ConversationState | null,
  values: Partial<ConversationState>,
): ConversationState {
  return {
    conversationId,
    region: previous?.region ?? null,
    lastIntent: previous?.lastIntent ?? null,
    lastDay: previous?.lastDay ?? null,
    lastPeriod: previous?.lastPeriod ?? null,
    pendingMessage: null,
    candidates: [],
    updatedAt: new Date().toISOString(),
    ...values,
  };
}

async function ambiguousResponse(
  conversationId: string,
  previous: ConversationState | null,
  intent: WeatherIntent,
  message: string,
  candidates: RegionCandidate[],
) {
  const answer = message;
  await saveConversationState(
    nextState(conversationId, previous, {
      lastIntent: intent,
      pendingMessage: message,
      candidates,
    }),
  );
  return response(conversationId, {
    intent,
    answer,
    message: answer,
    requiresLocationSelection: candidates.length > 0,
    candidates,
    suggestions: [],
    errorCode: candidates.length ? "LOCATION_AMBIGUOUS" : "LOCATION_REQUIRED",
  });
}

function continueUnknownIntent(
  parsed: ParsedWeatherIntent,
  previous: ConversationState | null,
  message: string,
) {
  const hasPendingLocationChoice = Boolean(previous?.candidates.length);
  if (
    parsed.intent !== "unknown" ||
    !previous ||
    (!hasPendingLocationChoice &&
      (!previous.region ||
        !/\b(kalau|di|daerah|wilayah|aja|saja|umum|keseluruhan)\b/i.test(
          message,
        )))
  )
    return parsed;
  return {
    ...parsed,
    intent: previous.lastIntent ?? "weather_forecast",
    isDynamic: true,
  } as ParsedWeatherIntent;
}

async function handleComparison(
  conversationId: string,
  previous: ConversationState | null,
  message: string,
  parsed: ParsedWeatherIntent,
) {
  const parts = extractComparisonParts(message);
  if (!parts)
    return response(conversationId, {
      intent: "compare_locations",
      answer:
        "Sebutkan dua lokasi secara jelas, misalnya: bandingkan cuaca Kelurahan Kwala Bekala dan Kelurahan Lau Cimba.",
      errorCode: "COMPARISON_LOCATIONS_REQUIRED",
    });
  const [leftResolution, rightResolution] = await Promise.all([
    resolveLocation(parts[0], null),
    resolveLocation(parts[1], null),
  ]);
  if (
    leftResolution.status !== "resolved" ||
    rightResolution.status !== "resolved"
  ) {
    const candidates = [
      ...leftResolution.candidates,
      ...rightResolution.candidates,
    ].slice(0, 12);
    return ambiguousResponse(
      conversationId,
      previous,
      "compare_locations",
      "Satu atau kedua lokasi belum spesifik. Pilih desa/kelurahan atau tulis dua nama yang lebih lengkap.",
      candidates,
    );
  }
  const [leftWeather, rightWeather] = await Promise.all([
    getCachedWeather(leftResolution.region.adm4),
    getCachedWeather(rightResolution.region.adm4),
  ]);
  const leftItem = primaryForecast(selectForecasts(leftWeather, parsed));
  const rightItem = primaryForecast(selectForecasts(rightWeather, parsed));
  if (!leftItem || !rightItem)
    return response(conversationId, {
      intent: "compare_locations",
      answer:
        "Data prakiraan untuk salah satu lokasi atau waktu tersebut belum tersedia dari BMKG. Sumber data: BMKG.",
      errorCode: "FORECAST_NOT_AVAILABLE",
    });
  await saveConversationState(
    nextState(conversationId, previous, {
      region: rightResolution.region,
      lastIntent: "compare_locations",
      lastDay: parsed.day,
      lastPeriod: parsed.period,
    }),
  );
  return response(conversationId, {
    success: true,
    intent: "compare_locations",
    location: rightResolution.region,
    answer: generateComparisonAnswer(
      { region: leftResolution.region, item: leftItem },
      { region: rightResolution.region, item: rightItem },
    ),
    forecast: [leftItem, rightItem],
  });
}

async function handleRegencySummary(
  conversationId: string,
  previous: ConversationState | null,
  parsed: ParsedWeatherIntent,
  regency: RegionCandidate,
) {
  if (parsed.intent === "weather_warning") {
    const warningResponse = await getCachedAlerts();
    const alerts = filterAlertsForRegion(warningResponse, regency);
    const answer =
      warningResponse.status === "unavailable"
        ? `Sistem belum dapat memeriksa peringatan BMKG untuk ${regency.regencyName}. Status peringatan belum dapat dipastikan. Sumber data: BMKG.`
        : warningResponse.status === "none"
          ? `Tidak ada peringatan dini cuaca aktif pada feed BMKG Sumatera Utara saat diperiksa. Ini bukan jaminan bahwa seluruh ${regency.regencyName} aman. Sumber data: BMKG.`
          : alerts.length
            ? `Ada ${alerts.length} peringatan dini BMKG yang mencakup atau berkaitan dengan ${regency.regencyName}. Buka detail peringatan dan ikuti arahan resmi BMKG.`
            : `Ada peringatan aktif di Sumatera Utara, tetapi ${regency.regencyName} tidak tercantum sebagai wilayah terdampak pada data yang tersedia. Tetap ikuti pembaruan resmi BMKG.`;
    await saveConversationState(
      nextState(conversationId, previous, {
        region: regency,
        lastIntent: parsed.intent,
        lastDay: parsed.day,
        lastPeriod: parsed.period,
      }),
    );
    return response(conversationId, {
      success: warningResponse.status !== "unavailable",
      intent: parsed.intent,
      location: regency,
      answer,
      alerts,
      errorCode:
        warningResponse.status === "unavailable"
          ? "ALERT_SERVICE_UNAVAILABLE"
          : undefined,
    });
  }

  const representatives = getRepresentativeRegionsForRegency(
    regency.regencyCode,
    5,
  );
  const entries = await Promise.all(
    representatives.map(async (region) => {
      try {
        const weather = await getCachedWeather(region.adm4);
        return { region, forecasts: selectForecasts(weather, parsed) };
      } catch (error) {
        console.error(
          "Ringkasan cuaca wilayah gagal:",
          region.adm4,
          error instanceof ServiceError ? error.code : "UNKNOWN",
        );
        return { region, forecasts: [] };
      }
    }),
  );
  const summary = buildRegionalWeatherSummary(regency, parsed, entries);
  await saveConversationState(
    nextState(conversationId, previous, {
      region: regency,
      lastIntent: parsed.intent,
      lastDay: parsed.day,
      lastPeriod: parsed.period,
    }),
  );
  return response(conversationId, {
    success: summary.availableAreaCount > 0,
    intent: parsed.intent,
    location: regency,
    answer: generateRegionalWeatherAnswer(summary),
    regionalSummary: summary,
    errorCode: summary.availableAreaCount
      ? undefined
      : "FORECAST_NOT_AVAILABLE",
  });
}

export async function handleWeatherChat(
  input: WeatherChatRequest,
): Promise<WeatherChatResponse> {
  const conversationId = input.conversationId ?? createConversationId();
  const previous = await getConversationState(conversationId);
  if (isStaticFaqQuestion(input.message)) {
    const faq = answerStaticFaq(input.message);
    return response(conversationId, {
      success: true,
      answer: faq.answer,
      suggestions: faq.suggestions,
    });
  }
  const parsed = continueUnknownIntent(
    parseWeatherIntent(input.message),
    previous,
    input.message,
  );

  if (parsed.intent === "unknown") {
    const faq = answerStaticFaq(input.message);
    return response(conversationId, {
      success: true,
      answer: faq.answer,
      suggestions: faq.suggestions,
    });
  }

  try {
    if (parsed.intent === "compare_locations")
      return await handleComparison(
        conversationId,
        previous,
        input.message,
        parsed,
      );

    if (input.selectedRegion?.level === "regency") {
      const base = getRegionByAdm4(input.selectedRegion.adm4);
      if (!base)
        return response(conversationId, {
          intent: parsed.intent,
          answer:
            "Kabupaten/kota tersebut belum tersedia dalam dataset wilayah.",
          errorCode: "LOCATION_NOT_FOUND",
        });
      return handleRegencySummary(conversationId, previous, parsed, {
        ...base,
        level: "regency",
        label: `Ringkasan umum ${base.regencyName}`,
      });
    }

    if (input.selectedRegion?.level === "district") {
      const villages = getVillageCandidatesForDistrict(
        input.selectedRegion.districtCode,
      );
      return ambiguousResponse(
        conversationId,
        previous,
        parsed.intent,
        villages.length
          ? `Kecamatan ${input.selectedRegion.districtName} dipilih. Sekarang pilih desa/kelurahan agar saya dapat mengambil prakiraan BMKG untuk wilayah yang tepat.`
          : `Daftar desa/kelurahan untuk Kecamatan ${input.selectedRegion.districtName} belum tersedia. Silakan ketik nama desa/kelurahan secara langsung.`,
        villages,
      );
    }

    let region = input.selectedRegion
      ? getRegionByAdm4(input.selectedRegion.adm4)
      : null;
    if (!region) {
      const fallbackRegion =
        previous?.region ??
        (input.fallbackRegion
          ? getRegionByAdm4(input.fallbackRegion.adm4)
          : null);
      const resolution = await resolveLocation(input.message, fallbackRegion);
      if (resolution.status !== "resolved")
        return ambiguousResponse(
          conversationId,
          previous,
          parsed.intent,
          resolution.message,
          resolution.candidates,
        );
      if (resolution.region.level === "regency")
        return handleRegencySummary(
          conversationId,
          previous,
          parsed,
          resolution.region,
        );
      region = resolution.region;
    }

    if (parsed.intent === "weather_warning") {
      const warningResponse = await getCachedAlerts();
      const alerts = filterAlertsForRegion(warningResponse, region);
      await saveConversationState(
        nextState(conversationId, previous, {
          region,
          lastIntent: parsed.intent,
          lastDay: parsed.day,
          lastPeriod: parsed.period,
        }),
      );
      return response(conversationId, {
        success: warningResponse.status !== "unavailable",
        intent: parsed.intent,
        location: region,
        answer: generateWarningAnswer(region, warningResponse, alerts),
        alerts,
        errorCode:
          warningResponse.status === "unavailable"
            ? "ALERT_SERVICE_UNAVAILABLE"
            : undefined,
      });
    }

    const weather = await getCachedWeather(region.adm4);
    region = {
      ...region,
      latitude: weather.location.latitude ?? region.latitude,
      longitude: weather.location.longitude ?? region.longitude,
      timezone: weather.location.timezone || region.timezone,
    };

    const forecasts = selectForecasts(weather, parsed);
    const answer = generateWeatherAnswer(parsed, region, weather, forecasts);
    await saveConversationState(
      nextState(conversationId, previous, {
        region,
        lastIntent: parsed.intent,
        lastDay: parsed.day,
        lastPeriod: parsed.period,
      }),
    );
    return response(conversationId, {
      success: forecasts.length > 0,
      intent: parsed.intent,
      location: region,
      answer,
      forecast: forecasts.slice(0, parsed.wantsDetail ? 16 : 8),
      errorCode: forecasts.length ? undefined : "FORECAST_NOT_AVAILABLE",
    });
  } catch (error) {
    const code = error instanceof ServiceError ? error.code : "UNKNOWN";
    console.error("Weather chat gagal:", code);
    return response(conversationId, {
      intent: parsed.intent,
      answer:
        "Data BMKG sedang tidak dapat diakses. Silakan coba kembali beberapa saat lagi. Sumber data: BMKG.",
      errorCode: code === "TIMEOUT" ? "BMKG_TIMEOUT" : "BMKG_UNAVAILABLE",
    });
  }
}
