import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SkyEye — Monitoreo de Seguridad con IA",
    template: "%s | SkyEye",
  },
  description:
    "SkyEye convierte tus cámaras existentes en un sistema inteligente que detecta eventos importantes y te avisa al instante. Más tranquilidad, todo desde tu celular.",
  keywords: [
    "seguridad",
    "videovigilancia",
    "detección con IA",
    "cámaras",
    "alertas",
    "monitoreo",
  ],
  openGraph: {
    title: "SkyEye — Monitoreo de Seguridad con IA",
    description:
      "Convierte tus cámaras existentes en un sistema inteligente de alertas. Detecta eventos importantes sin mirar cámaras todo el día.",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
