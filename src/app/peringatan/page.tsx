import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { WarningsPage } from "@/components/pages/warnings-page";

export const metadata: Metadata = {
  title: "Peringatan Dini | BBMKG Wilayah I Medan",
  description: "Peringatan dini cuaca aktif untuk Sumatera Utara dari BMKG.",
};

export default function Page() {
  return (
    <AppShell fullscreen>
      <WarningsPage fullscreen />
    </AppShell>
  );
}
