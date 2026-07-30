import type { Metadata } from "next";
import { FaqPage } from "@/components/faq/faq-page";
import { AppShell } from "@/components/layout/app-shell";
export const metadata: Metadata = {
  title: "FAQ Interaktif BBMKG",
  description:
    "Temukan jawaban mengenai prakiraan cuaca, gempa bumi, peringatan dini, istilah BMKG, dan cara menggunakan dashboard.",
};
export default function Page() {
  return (
    <AppShell fullscreen>
      <FaqPage />
    </AppShell>
  );
}
