"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { fileToResizedDataUrl, saveVendedor, type Vendedor } from "@/lib/vendedor";

type Props = {
  initial?: Vendedor | null;
  onSaved: (v: Vendedor) => void;
  onClose: () => void;
  // Si se pasa, muestra "Omitir por ahora" bajo Guardar
  onSkip?: () => void;
};

export function VendedorProfileModal({ initial, onSaved, onClose, onSkip }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [telefono, setTelefono] = useState(initial?.telefono ?? "");
  const [logo, setLogo] = useState<string | undefined>(initial?.logo);
  const [error, setError] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  async function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingLogo(true);
    setError(null);
    try {
      setLogo(await fileToResizedDataUrl(file));
    } catch {
      setError("No se pudo cargar la imagen.");
    } finally {
      setLoadingLogo(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("Completá nombre y teléfono.");
      return;
    }
    const v: Vendedor = { nombre: nombre.trim(), telefono: telefono.trim(), logo };
    if (!saveVendedor(v)) {
      setError("No se pudo guardar. Probá con un logo más liviano.");
      return;
    }
    onSaved(v);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-white px-5 pt-5 pb-8 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Perfil del vendedor
            </p>
            <h2 className="mt-0.5 text-lg font-black text-ink">Tus datos para la propuesta</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-9 min-w-9 rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          <label className="text-xs font-semibold text-stone-600">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-normal text-ink"
            />
          </label>
          <label className="text-xs font-semibold text-stone-600">
            Teléfono
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-normal text-ink"
            />
          </label>
          <div className="text-xs font-semibold text-stone-600">
            Logo de tu inmobiliaria
            <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-md border-2 border-dashed border-stone-300 p-3 hover:bg-stone-50">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo de la inmobiliaria" className="h-14 w-14 rounded border border-stone-200 bg-white object-contain" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded bg-stone-100 text-2xl text-stone-400">
                  +
                </span>
              )}
              <span className="text-sm font-bold text-stone-700">
                {loadingLogo ? "Cargando…" : logo ? "Cambiar imagen" : "Subir imagen (JPG o PNG)"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleLogo}
                className="hidden"
              />
            </label>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo(undefined)}
                className="mt-1 text-xs font-normal text-stone-500 underline"
              >
                Quitar logo
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loadingLogo}
          className="mt-5 w-full rounded-md bg-leaf py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          Guardar
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-3 w-full text-center text-xs font-semibold text-stone-500 underline"
          >
            Omitir por ahora
          </button>
        )}
      </form>
    </div>
  );
}
