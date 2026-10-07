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
  // Android Chrome ≥108 superpone el teclado sin achicar el layout (resizes-visual):
  // con resizes-content el viewport se reduce y los formularios quedan visibles (OE 046)
  interactiveWidget: "resizes-content",
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
