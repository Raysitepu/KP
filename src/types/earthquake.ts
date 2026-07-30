export type Earthquake = {
  id: string;
  date: string;
  time: string;
  datetime: string | null;
  latitude: number | null;
  longitude: number | null;
  magnitude: number | null;
  depth: string;
  region: string;
  potential: string;
  felt: string | null;
  shakemapUrl: string | null;
};

export type EarthquakeResponse = {
  type: "latest" | "m5" | "felt";
  items: Earthquake[];
  fetchedAt: string;
};
