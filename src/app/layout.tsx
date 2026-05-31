import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Aglir Propiedades",
  description: "Terrenos disponibles en Barros Blancos",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1a6b45",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-UY">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
