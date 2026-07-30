export type WarningArea = {
  description: string | null;
  polygons: [number, number][][];
};

export type WeatherWarning = {
  identifier: string | null;
  sent: string | null;
  event: string | null;
  urgency: string | null;
  severity: string | null;
  certainty: string | null;
  effective: string | null;
  expires: string | null;
  senderName: string | null;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  web: string | null;
  areas: WarningArea[];
};

export type WarningResponse = {
  status: "active" | "none" | "unavailable";
  province: "Sumatera Utara";
  checkedAt: string;
  feedUpdatedAt: string | null;
  message: string | null;
  warnings: WeatherWarning[];
};
