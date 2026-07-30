export type Location = {
  province: string;
  regency: string;
  district: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  adm4: string;
};

export type NormalizedForecast = {
  datetime: string;
  localDatetime?: string;
  utcDatetime?: string | null;
  date: string;
  time: string;
  temperature: number | null;
  humidity: number | null;
  weatherDescription: string;
  weatherDescriptionEn: string | null;
  windSpeed: number | null;
  windDirection: string | null;
  cloudCover: number | null;
  visibility: string | null;
  iconUrl: string | null;
  analysisDate: string | null;
};

export type WeatherResponse = {
  location: Location;
  forecasts: NormalizedForecast[];
  grouped: Record<string, NormalizedForecast[]>;
  current: NormalizedForecast | null;
  fetchedAt: string;
};

export type Region = {
  provinceCode: string;
  regencyCode: string;
  districtCode: string;
  adm4: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  label: string;
  searchText: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  bmkgPageUrl: string;
  bmkgPageName?: string;
  validationStatus: "valid" | "pending";
};

export type RegionDataset = {
  metadata: {
    source: string;
    generatedAt: string;
    generator: string;
    province: "Sumatera Utara";
  };
  province: { code: "12"; name: "Sumatera Utara" };
  regencies: {
    code: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
  }[];
  districts: {
    code: string;
    name: string;
    regencyCode: string;
    regencyName: string;
    latitude: number | null;
    longitude: number | null;
  }[];
  villages: Region[];
};
