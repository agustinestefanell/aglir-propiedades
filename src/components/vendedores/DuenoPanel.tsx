"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { scrollFocusedFieldIntoView } from "@/lib/mobileForm";
import {
  PROPUESTAS_TABLE,
  VENDEDORES_TABLE,
  countBy,
  crearVendedorEquipo,
  fetchEquipo,
  fetchPropuestas,
  setEstadoVendedor,
  type EstadoVendedor,
  type PropuestaRow,
  type VendedorRow,
  type VendedorSession,
} from "@/lib/vendedores";

const inputCls = "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-normal text-ink";

function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Alta de vendedor ────────────────────────────────────────────────────────

function NuevoVendedorForm({ duenoId, onCreated }: { duenoId: string; onCreated: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("Completá nombre y teléfono.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener 4 dígitos.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await crearVendedorEquipo(duenoId, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      mail,
      pin,
    });
    setSaving(false);
    if (result.status === "pin_en_uso") setError("Ese PIN ya está en uso. Elegí otro.");
    // Error real de Supabase en pantalla → diagnosticable sin DevTools
    else if (result.status === "error")
      setError(`No se pudo crear el vendedor: ${result.message ?? "error desconocido"}`);
    else {
      setNombre("");
      setTelefono("");
      setMail("");
      setPin("");
      onCreated();
    }
  }

  return (
    <form onSubmit={handleSubmit} onFocus={scrollFocusedFieldIntoView} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">Nuevo vendedor</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs font-semibold text-stone-600">
          Nombre
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          Teléfono
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls} />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          PIN (4 dígitos)
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={`${inputCls} tracking-[0.4em]`}
          />
        </label>
        <label className="col-span-2 text-xs font-semibold text-stone-600">
          Mail
          <input
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="Mail (opcional)"
            className={inputCls}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 w-full rounded-md bg-leaf py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Creando…" : "Crear vendedor"}
      </button>
    </form>
  );
}

// ── Panel del Dueño ─────────────────────────────────────────────────────────

export function DuenoPanel({ session, vista }: { session: VendedorSession; vista: "equipo" | "propuestas" }) {
  const [equipo, setEquipo] = useState<VendedorRow[]>([]);
  const [propuestas, setPropuestas] = useState<PropuestaRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const eq = await fetchEquipo(session.id);
    setEquipo(eq);
    // Propuestas del equipo + las del propio Dueño
    setPropuestas(await fetchPropuestas([session.id, ...eq.map((v) => v.id)]));
  }, [session.id]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`equipo_${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: VENDEDORES_TABLE }, () => { refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: PROPUESTAS_TABLE }, () => { refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session.id, refresh]);

  async function changeEstado(id: string, estado: EstadoVendedor) {
    setBusyId(id);
    const ok = await setEstadoVendedor(id, estado);
    if (ok) setEquipo((prev) => prev.map((v) => (v.id === id ? { ...v, estado } : v)));
    setBusyId(null);
  }

  const counts = countBy(propuestas.map((p) => p.vendedor_id));
  const nombreDe = (id: string) =>
    id === session.id ? `${session.nombre} (vos)` : equipo.find((v) => v.id === id)?.nombre ?? "—";

  if (vista === "propuestas") {
    return (
      <section className="mx-auto grid w-full max-w-[430px] gap-2 px-4 pt-3 pb-8">
        {propuestas.length === 0 ? (
          <p className="pt-8 text-center text-sm text-stone-500">Tu equipo todavía no envió propuestas.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Vendedor</th>
                  <th className="py-2 text-left font-bold">Terreno</th>
                  <th className="px-3 py-2 text-right font-bold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {propuestas.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="px-3 py-2 font-semibold text-ink">{nombreDe(p.vendedor_id)}</td>
                    <td className="py-2 text-stone-700">
                      M{p.manzana} · S{p.solar}
                    </td>
                    <td className="px-3 py-2 text-right text-stone-500">{formatFechaCorta(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[430px] gap-3 px-4 pt-3 pb-8">
      <NuevoVendedorForm duenoId={session.id} onCreated={refresh} />

      {equipo.length === 0 ? (
        <p className="pt-4 text-center text-sm text-stone-500">Todavía no creaste vendedores.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2 text-left font-bold">Vendedor</th>
                <th className="py-2 font-bold">PIN</th>
                <th className="py-2 font-bold">Estado</th>
                <th className="py-2 font-bold" title="Propuestas enviadas">Prop.</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {equipo.map((v) => (
                <tr key={v.id} className="border-t border-stone-100">
                  <td className="px-3 py-2">
                    <p className="font-bold text-ink">{v.nombre}</p>
                    <p className="text-stone-500">{v.telefono}</p>
                  </td>
                  <td className="py-2 text-center font-mono font-bold tracking-widest text-ink">{v.pin ?? "—"}</td>
                  <td className="py-2 text-center">
                    <span
                      className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        v.estado === "activo" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {v.estado}
                    </span>
                  </td>
                  <td className="py-2 text-center font-bold text-ink">{counts[v.id] ?? 0}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => changeEstado(v.id, v.estado === "activo" ? "inactivo" : "activo")}
                      disabled={busyId === v.id}
                      className={`rounded px-2 py-1 text-[11px] font-bold disabled:opacity-60 ${
                        v.estado === "activo"
                          ? "border border-stone-300 text-stone-600"
                          : "bg-leaf text-white"
                      }`}
                    >
                      {v.estado === "activo" ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
