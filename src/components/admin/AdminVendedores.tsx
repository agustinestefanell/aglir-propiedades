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
  archivado: "bg-stone-200 text-stone-500",
};

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
        badgeCls[estado] ?? "bg-stone-100 text-stone-600"
      }`}
    >
      {estado}
    </span>
  );
}

function AccionEstado({
  v,
  busy,
  onChange,
}: {
  v: VendedorRow;
  busy: boolean;
  onChange: (id: string, estado: EstadoVendedor) => void;
}) {
  const secundario =
    "rounded border border-stone-300 px-2 py-1 text-[11px] font-bold text-stone-600 disabled:opacity-60";
  if (v.estado === "activo") {
    return (
      <button
        type="button"
        onClick={() => onChange(v.id, "inactivo")}
        disabled={busy}
        className="rounded bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-60"
      >
        Desactivar
      </button>
    );
  }
  // archivado → solo Desarchivar (vuelve a inactivo); no se reactiva directo (OE 048)
  if (v.estado === "archivado") {
    return (
      <button type="button" onClick={() => onChange(v.id, "inactivo")} disabled={busy} className={secundario}>
        Desarchivar
      </button>
    );
  }
  // pendiente → Aprobar; inactivo → Activar + Archivar
  return (
    <div className="flex gap-1">
      {v.estado === "inactivo" && (
        <button type="button" onClick={() => onChange(v.id, "archivado")} disabled={busy} className={secundario}>
          Archivar
        </button>
      )}
      <button
        type="button"
        onClick={() => onChange(v.id, "activo")}
        disabled={busy}
        className="rounded bg-leaf px-2 py-1 text-[11px] font-bold text-white disabled:opacity-60"
      >
        {v.estado === "pendiente" ? "Aprobar" : "Activar"}
      </button>
    </div>
  );
}

export function AdminVendedores() {
  const [vendedores, setVendedores] = useState<VendedorRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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

  const archivadosCount = vendedores.filter((v) => v.estado === "archivado").length;
  const visible = (v: VendedorRow) => showArchived || v.estado !== "archivado";

  const duenos = vendedores.filter((v) => v.rol === "dueno");
  // Con todos los Dueños (incluso archivados) para que su equipo no caiga en "sin dueño"
  const duenoIds = new Set(duenos.map((d) => d.id));
  const equipoDe = (id: string) =>
    vendedores.filter((v) => v.rol !== "dueno" && v.dueno_id === id && visible(v));
  // Sin Dueño (o con dueno_id que no corresponde a un Dueño existente)
  const independientes = vendedores.filter(
    (v) => v.rol !== "dueno" && (!v.dueno_id || !duenoIds.has(v.dueno_id)) && visible(v)
  );
  // Un Dueño archivado se oculta, salvo que tenga vendedores visibles en su equipo
  const duenosVisibles = duenos.filter((d) => visible(d) || equipoDe(d.id).length > 0);

  function VendedorLine({ v, duenoInactivo }: { v: VendedorRow; duenoInactivo?: boolean }) {
    return (
      <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-3 py-2 text-xs">
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{v.nombre}</p>
          <p className="truncate text-stone-500">
            {v.telefono}
            {v.mail ? ` · ${v.mail}` : ""}
          </p>
          {duenoInactivo && v.estado === "activo" && (
            <p className="text-[10px] font-semibold text-red-600">Sin acceso: dueño inactivo</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EstadoBadge estado={v.estado} />
          <span className="w-6 text-center font-bold text-ink" title="Propuestas enviadas">
            {counts[v.id] ?? 0}
          </span>
          <AccionEstado v={v} busy={busyId === v.id} onChange={changeEstado} />
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[430px] gap-3 px-2 pt-3 pb-6">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] uppercase tracking-wide text-stone-400">
          Número junto al estado = propuestas enviadas
        </p>
        <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-stone-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-3.5 w-3.5 accent-leaf"
          />
          Mostrar archivados ({archivadosCount})
        </label>
      </div>

      {duenosVisibles.map((d) => {
        const equipo = equipoDe(d.id);
        // Total histórico: incluye propuestas de vendedores archivados aunque estén ocultos
        const totalEquipo =
          (counts[d.id] ?? 0) +
          vendedores.filter((v) => v.dueno_id === d.id).reduce((acc, v) => acc + (counts[v.id] ?? 0), 0);
        const duenoInactivo = d.estado !== "activo";
        return (
          <div key={d.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-2 bg-stone-50 px-3 py-3">
              <div className="flex min-w-0 items-start gap-2.5">
                {d.logo_inmobiliaria ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.logo_inmobiliaria}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded border border-stone-200 bg-white object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded border border-dashed border-stone-300" />
                )}
                <div className="min-w-0 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Dueño</p>
                  <p className="truncate text-sm font-black text-ink">{d.nombre}</p>
                  <p className="truncate text-stone-500">{d.telefono}</p>
                  {d.mail && <p className="truncate text-stone-500">{d.mail}</p>}
                  <p className="mt-1 font-semibold text-stone-700">
                    {totalEquipo} propuesta{totalEquipo === 1 ? "" : "s"} del equipo · {equipo.length} vendedor
                    {equipo.length === 1 ? "" : "es"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <EstadoBadge estado={d.estado} />
                <AccionEstado v={d} busy={busyId === d.id} onChange={changeEstado} />
              </div>
            </div>
            {equipo.length === 0 ? (
              <p className="border-t border-stone-100 px-3 py-2 text-xs text-stone-400">Sin vendedores aún.</p>
            ) : (
              equipo.map((v) => <VendedorLine key={v.id} v={v} duenoInactivo={duenoInactivo} />)
            )}
          </div>
        );
      })}

      {independientes.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <p className="bg-stone-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Vendedores sin dueño
          </p>
          {independientes.map((v) => (
            <VendedorLine key={v.id} v={v} />
          ))}
        </div>
      )}
    </section>
  );
}
