import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { AboutPage } from "@/components/pages/about-page";

export const metadata: Metadata = {
  title: "Tentang Sistem | BBMKG Wilayah I Medan",
  description: "Tujuan, sumber data, dan batasan sistem informasi BBMKG.",
};

export default function Page() {
  return (
    <AppShell>
      <AboutPage />
    </AppShell>
  );
}
