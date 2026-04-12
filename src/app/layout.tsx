import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import InstallPrompt from "@/components/InstallPrompt";

const outfit = Outfit({
  subsets: ["latin"],
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
  themeColor: "#8d6e63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={outfit.className} suppressHydrationWarning>
      <body>
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
