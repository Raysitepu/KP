import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { WebgisPage } from "@/components/pages/webgis-page";

export const metadata: Metadata = {
  title: "Peta WebGIS Interaktif | BBMKG Wilayah I Medan",
  description: "Peta interaktif cuaca, gempa, dan peringatan dini BMKG.",
};

export default function Page() {
  return (
    <AppShell>
      <WebgisPage />
    </AppShell>
  );
}
