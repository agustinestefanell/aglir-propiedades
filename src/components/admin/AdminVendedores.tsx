"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PROPUESTAS_TABLE,
  VENDEDORES_TABLE,
  fetchPropuestaCounts,
  fetchVendedores,
  setEstadoVendedor,
  type EstadoVendedor,
  type VendedorRow,
} from "@/lib/vendedores";

const badgeCls: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  activo: "bg-emerald-100 text-emerald-800",
};

export function AdminVendedores() {
  const [vendedores, setVendedores] = useState<VendedorRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchVendedores().then(setVendedores);
    fetchPropuestaCounts().then(setCounts);

    const channel = supabase
      .channel("vendedores_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: VENDEDORES_TABLE }, () => {
        fetchVendedores().then(setVendedores);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: PROPUESTAS_TABLE }, () => {
        fetchPropuestaCounts().then(setCounts);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function changeEstado(id: string, estado: EstadoVendedor) {
    setBusyId(id);
    const ok = await setEstadoVendedor(id, estado);
    if (ok) setVendedores((prev) => prev.map((v) => (v.id === id ? { ...v, estado } : v)));
    setBusyId(null);
  }

  if (vendedores.length === 0) {
    return (
      <p className="mx-auto max-w-[430px] px-4 pt-8 text-center text-sm text-stone-500">
        Sin vendedores registrados aún.
      </p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[430px] px-2 pt-3 pb-6">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[46%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-2 py-2 text-left font-bold">Vendedor</th>
              <th className="py-2 font-bold">Estado</th>
              <th className="py-2 font-bold" title="Propuestas enviadas">Prop.</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v) => (
              <tr key={v.id} className="border-b border-stone-100 align-top last:border-b-0">
                <td className="px-2 py-2">
                  <p className="truncate font-bold text-ink">{v.nombre}</p>
                  <p className="truncate text-stone-500">{v.telefono}</p>
                  <p className="truncate text-stone-500">{v.mail}</p>
                </td>
                <td className="py-2 text-center">
                  <span
                    className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      badgeCls[v.estado] ?? "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {v.estado}
                  </span>
                </td>
                <td className="py-2 text-center font-bold text-ink">{counts[v.id] ?? 0}</td>
                <td className="py-2 pr-2">
                  {v.estado === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => changeEstado(v.id, "activo")}
                      disabled={busyId === v.id}
                      className="w-full rounded bg-leaf px-1.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      Aprobar
                    </button>
                  )}
                  {v.estado === "activo" && (
                    <button
                      type="button"
                      onClick={() => changeEstado(v.id, "inactivo")}
                      disabled={busyId === v.id}
                      className="w-full rounded border border-stone-300 px-1.5 py-1 text-[11px] font-bold text-stone-600 disabled:opacity-60"
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
