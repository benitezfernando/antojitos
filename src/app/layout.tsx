import type { Metadata, Viewport } from "next";
import { Outfit, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import InstallPrompt from "@/components/InstallPrompt";
import NavigationProgress from "@/components/NavigationProgress";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Antojitos Admin",
  description: "Sistema de administración de inventarios, costos y recetas para Antojitos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Antojitos",
  },
  icons: {
    apple: "/ico.jpeg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b4a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${geist.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: "var(--font-outfit, 'Outfit'), system-ui, sans-serif" }}>
        <NavigationProgress />
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
