"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLotStates } from "@/lib/lotStates";
import { loadVendedor, type Vendedor } from "@/lib/vendedor";
import { VendedorProfileModal } from "@/components/admin/VendedorProfileModal";

const SVG_W = 100;
const SVG_H = 155.2;

function formatFecha(d: Date): string {
  // "06 de octubre de 2026"
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" });
}

type Modo = "publico" | "vendedor";

export default function PropuestaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { modo?: string };
}) {
  // Sin parámetro (o valor desconocido) → versión pública: nunca expone datos del vendedor por defecto
  const modo: Modo = searchParams.modo === "vendedor" ? "vendedor" : "publico";
  const esVendedor = modo === "vendedor";
  const router = useRouter();
  const [lots] = useLotStates();
  const lot = lots.find((l) => l.id === params.id);

  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [fecha, setFecha] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  // localStorage y fecha solo en cliente (evita mismatch de hidratación)
  useEffect(() => {
    if (esVendedor) setVendedor(loadVendedor());
    setFecha(formatFecha(new Date()));
  }, [esVendedor]);

  async function handleDownload() {
    if (!docRef.current || !lot) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `propuesta-m${lot.manzana}-s${lot.solar}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.click();
    } catch (e) {
      console.error("Error generando JPG:", e);
      alert("No se pudo generar la imagen.");
    } finally {
      setDownloading(false);
    }
  }

  if (!lot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6">
        <p className="text-sm font-semibold text-stone-600">Terreno no encontrado.</p>
      </main>
    );
  }

  const precioUr = lot.precio_ur;
  const points = lot.polygon.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <main className="min-h-screen bg-paper pb-10">
      {/* Barra de acciones — fuera del área capturada */}
      <div className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[600px] items-center gap-2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600"
          >
            ← Volver
          </button>
          {esVendedor && (
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600"
            >
              Editar mi perfil
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="ml-auto rounded-md bg-leaf px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {downloading ? "Generando…" : "Descargar JPG"}
          </button>
        </div>
      </div>

      {/* Documento capturado por html2canvas */}
      <div className="mx-auto max-w-[600px] px-2 pt-4">
        <div ref={docRef} className="bg-white px-6 py-6 text-ink">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Aglir Propiedades" className="h-16 w-16 object-contain" />
            {/* Slot fijo a la derecha: sin logo queda vacío y el header no se mueve */}
            <div className="flex h-16 w-24 items-center justify-end">
              {esVendedor && vendedor?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendedor.logo} alt={vendedor.nombre} className="max-h-16 max-w-24 object-contain" />
              )}
            </div>
          </div>

          {/* Identificación del terreno */}
          <div className="py-5 text-center">
            <h1 className="text-2xl font-black">
              Manzana {lot.manzana} · Solar {lot.solar}
            </h1>
            <p className="mt-1 text-lg font-bold text-stone-600">
              {lot.area_m2 > 0 ? lot.area_m2 : "—"} m²
            </p>
            <p className="mt-1 text-lg font-bold">
              Precio: {precioUr ? `${precioUr} UR` : "a consultar"}
            </p>
          </div>

          {/* Plano: <img> + SVG solo con el polígono (sin <image> dentro del SVG,
              porque html2canvas serializa el SVG y no carga recursos externos ahí) */}
          <div className="relative w-full" style={{ aspectRatio: `${SVG_W} / ${SVG_H}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/plan/plano-11223.png"
              alt="Plano del fraccionamiento"
              className="absolute inset-0 h-full w-full"
            />
            {points && (
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                {/* Atributos inline (no clases Tailwind): html2canvas no aplica CSS externo al SVG */}
                <polygon
                  points={points}
                  fill="rgba(250, 204, 21, 0.65)"
                  stroke="#ca8a04"
                  strokeWidth={0.3}
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Descripción */}
          <div className="mt-6 space-y-3 text-[15px] leading-6">
            <p className="font-black">
              Entrega inicial $200mil (incluye comisión inmobiliaria):
            </p>
            <div>
              <p>→ Seña $25mil</p>
              <p>→ Se firma Boleto de Reserva</p>
              <p>→ 7 cuotas de $25mil</p>
            </div>
            <p>
              → Terminás de pagar la entrega inicial y firmamos
              <br />
              la Promesa de Compraventa: <span className="font-black">AHÍ ENTRÁS AL TERRENO!!</span>
            </p>
            <p>→ Pagás Primera Cuota</p>
            <div className="rounded-md bg-paper px-4 py-3">
              <p className="font-black">
                Cuotas a 12 años desde {precioUr ? `${precioUr} UR` : "— UR"}
              </p>
              <p>1UR = $1.940 aprox</p>
              <p>10UR = $19.400 aprox</p>
            </div>
            <p className="text-sm italic text-stone-500">(Los precios varían según el tamaño)</p>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-stone-200 pt-4 text-sm">
            {esVendedor && vendedor && (
              <p className="font-bold">
                {vendedor.nombre} · {vendedor.telefono}
              </p>
            )}
            <p className="text-stone-600">Fecha: {fecha}</p>
            <p className="text-stone-600">Propuesta válida por 15 días</p>
          </div>
        </div>
      </div>

      {esVendedor && showProfile && (
        <VendedorProfileModal
          initial={vendedor}
          onSaved={(v) => { setVendedor(v); setShowProfile(false); }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </main>
  );
}
