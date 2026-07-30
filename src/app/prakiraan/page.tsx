import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ForecastPage } from "@/components/pages/forecast-page";

export const metadata: Metadata = {
  title: "Prakiraan Cuaca | BBMKG Wilayah I Medan",
  description: "Prakiraan cuaca BMKG per wilayah di Sumatera Utara.",
};

export default function Page() {
  return (
    <AppShell>
      <ForecastPage />
    </AppShell>
  );
}
