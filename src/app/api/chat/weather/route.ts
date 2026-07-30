import { NextResponse } from "next/server";
import { sanitizeMessage, weatherChatRequestSchema } from "@/schemas/chatbot";
import { handleWeatherChat } from "@/lib/chatbot/chat-service";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(requestKey(request, "weather-chat"), { limit: 30 });
  if (!limit.allowed)
    return NextResponse.json(
      {
        success: false,
        errorCode: "RATE_LIMITED",
        answer: "Terlalu banyak pertanyaan. Silakan tunggu sebentar.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        errorCode: "INVALID_JSON",
        answer: "Format permintaan tidak valid.",
      },
      { status: 400 },
    );
  }
  const parsed = weatherChatRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        errorCode: "INVALID_REQUEST",
        answer: parsed.error.issues[0]?.message ?? "Permintaan tidak valid.",
      },
      { status: 400 },
    );
  const result = await handleWeatherChat({
    ...parsed.data,
    message: sanitizeMessage(parsed.data.message),
  });
  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
