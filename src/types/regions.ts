export type RegionLevel = "province" | "regency" | "district" | "village";

export type RegionRecord = {
  id?: string;
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  districtCode: string;
  districtName: string;
  villageCode: string;
  villageName: string;
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  normalizedName: string;
  aliases: string[];
};

export type RegionCandidate = RegionRecord & {
  level: RegionLevel;
  label: string;
  score: number;
  matchedBy: "exact" | "alias" | "fuzzy" | "context";
};

export type LocationResolution =
  | {
      status: "resolved";
      region: RegionCandidate;
      candidates: [];
      message: null;
    }
  | {
      status: "ambiguous";
      region: null;
      candidates: RegionCandidate[];
      message: string;
    }
  | {
      status: "not_found" | "missing";
      region: null;
      candidates: [];
      message: string;
    };
