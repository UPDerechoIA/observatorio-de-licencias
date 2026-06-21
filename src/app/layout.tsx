import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { LegalDisclaimer } from "@/components/Disclaimer";
import { EntryNotice } from "@/components/EntryNotice";

// Serif editorial para títulos/marca (gravitas jurídica); sans legible para UI densa.
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const SITE_DESCRIPTION =
  "Observatorio jurídico-académico de la Universidad de Palermo: lee y audita, con evidencia textual, las condiciones legales de herramientas de IA y software cotidiano. Análisis preliminar; no es asesoramiento legal.";

export const metadata: Metadata = {
  // URL canónica del sitio publicado (incluye la subruta de GitHub Pages). Con
  // trailing slash para que las rutas relativas (p. ej. "og.png") resuelvan a
  // absolutas correctas en las etiquetas Open Graph / Twitter.
  metadataBase: new URL("https://upderechoia.github.io/observatorio-de-licencias/"),
  title: {
    default: "E-Law — Observatorio de condiciones legales | Universidad de Palermo",
    template: "%s · E-Law",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "E-Law · Universidad de Palermo",
    locale: "es_AR",
    title: "E-Law — Observatorio de condiciones legales",
    description: SITE_DESCRIPTION,
    images: [{ url: "og.png", width: 1200, height: 630, alt: "E-Law · Universidad de Palermo — Facultad de Derecho" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Law — Observatorio de condiciones legales",
    description: SITE_DESCRIPTION,
    images: ["og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lora.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <EntryNotice />
        <Header />
        {/* Ancho lo define cada página vía PageContainer (alineado con header/footer). */}
        <main className="py-6">{children}</main>
        <footer className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-10 xl:px-12">
          <LegalDisclaimer />
        </footer>
      </body>
    </html>
  );
}
