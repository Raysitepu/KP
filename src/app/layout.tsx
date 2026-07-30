import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title:
    "Prototype Dashboard Interaktif Monitoring Cuaca dan Gempa Bumi Berbasis WebGIS Terintegrasi FAQ Interaktif pada BBMKG Wilayah I Medan",
  description:
    "Dashboard WebGIS BBMKG Wilayah I Medan dengan prakiraan cuaca, informasi gempa, peringatan dini, dan FAQ interaktif deterministik.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={jakarta.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
