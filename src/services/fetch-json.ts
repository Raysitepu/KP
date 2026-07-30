export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export async function fetchJson(
  url: string,
  timeoutMs = 10_000,
  init?: RequestInit,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok)
      throw new ServiceError(
        "UPSTREAM_ERROR",
        "Layanan sumber data sedang bermasalah.",
        502,
      );
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new ServiceError(
        "INVALID_CONTENT",
        "Format sumber data tidak sesuai.",
      );
    try {
      return await response.json();
    } catch {
      throw new ServiceError(
        "MALFORMED_JSON",
        "Data sumber tidak dapat dibaca.",
      );
    }
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw new ServiceError(
        "TIMEOUT",
        "Sumber data terlalu lama merespons.",
        504,
      );
    throw new ServiceError(
      "NETWORK_ERROR",
      "Sumber data belum dapat dihubungi.",
    );
  } finally {
    clearTimeout(timer);
  }
}
