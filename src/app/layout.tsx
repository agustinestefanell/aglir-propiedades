import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aglir Propiedades",
  description: "Terrenos disponibles en Barros Blancos"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-UY">
      <body>{children}</body>
    </html>
  );
}
