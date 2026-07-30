import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { EarthquakesPage } from "@/components/pages/earthquakes-page";

export const metadata: Metadata = {
  title: "Data Gempa Bumi | BBMKG Wilayah I Medan",
  description: "Data gempa terbaru, M5+, dan dirasakan dari BMKG.",
};

export default function Page() {
  return (
    <AppShell>
      <EarthquakesPage />
    </AppShell>
  );
}
