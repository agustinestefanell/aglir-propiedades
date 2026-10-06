import type { Lot } from "@/types";
import { supabase } from "./supabase";
import { loadVendedor, saveVendedor } from "./vendedor";

// Esquema asumido (OE 040) — ver handoff.md para el SQL de verificación:
//   vendedores: id, nombre, telefono, mail, pin, estado ("pendiente" | "activo" | "inactivo"), created_at
//   propuestas: id, vendedor_id, lot_id, manzana, solar, created_at
export const VENDEDORES_TABLE = "vendedores";
export const PROPUESTAS_TABLE = "propuestas";

export const SESSION_KEY = "aglir_vendedor_session";
// Marca que este dispositivo ya registró un vendedor → /vendedores abre en Login en vez de Registro
export const REGISTRADO_KEY = "aglir_vendedor_registrado";

export type EstadoVendedor = "pendiente" | "activo" | "inactivo";

export type VendedorRow = {
  id: string;
  nombre: string;
  telefono: string;
  mail: string;
  estado: EstadoVendedor;
  created_at?: string;
};

export type VendedorSession = Pick<VendedorRow, "id" | "nombre" | "telefono" | "mail">;

// ── Sesión (localStorage) ───────────────────────────────────────────────────

export function loadSession(): VendedorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as VendedorSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: VendedorSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  // Siembra el perfil que usa /propuesta?modo=vendedor, conservando el logo si ya había uno
  const prev = loadVendedor();
  saveVendedor({ nombre: s.nombre, telefono: s.telefono, logo: prev?.logo });
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Vendedor ────────────────────────────────────────────────────────────────

export type RegistroResult = "ok" | "pin_en_uso" | "error";

export async function registrarVendedor(data: {
  nombre: string;
  telefono: string;
  mail: string;
  pin: string;
}): Promise<RegistroResult> {
  // El login es solo por PIN, así que dos vendedores no pueden compartirlo
  const { data: existing, error: checkError } = await supabase
    .from(VENDEDORES_TABLE)
    .select("id")
    .eq("pin", data.pin)
    .limit(1);
  if (checkError) console.error("Error verificando PIN:", checkError);
  if (existing && existing.length > 0) return "pin_en_uso";

  const { error } = await supabase
    .from(VENDEDORES_TABLE)
    .insert({ ...data, estado: "pendiente" });
  if (error) {
    console.error("Error registrando vendedor:", error);
    return "error";
  }

  fetch("/api/push/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Nuevo vendedor registrado",
      body: `${data.nombre} · ${data.telefono}`,
      url: "/gestion",
    }),
  }).catch(() => {});

  return "ok";
}

export async function loginPorPin(pin: string): Promise<VendedorSession | null> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("id, nombre, telefono, mail")
    .eq("pin", pin)
    .eq("estado", "activo")
    .limit(1);
  if (error) {
    console.error("Error en login de vendedor:", error);
    return null;
  }
  return (data?.[0] as VendedorSession | undefined) ?? null;
}

// null = no se pudo determinar (error / RLS): no forzar logout en ese caso
export async function fetchEstadoVendedor(id: string): Promise<EstadoVendedor | null> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("estado")
    .eq("id", id)
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0].estado as EstadoVendedor;
}

export async function registrarPropuesta(vendedorId: string, lot: Lot): Promise<void> {
  const { error } = await supabase.from(PROPUESTAS_TABLE).insert({
    vendedor_id: vendedorId,
    lot_id: lot.id,
    manzana: lot.manzana,
    solar: lot.solar,
  });
  if (error) console.error("Error registrando propuesta:", error);
}

// ── Admin ───────────────────────────────────────────────────────────────────

export async function fetchVendedores(): Promise<VendedorRow[]> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("id, nombre, telefono, mail, estado, created_at")
    .order("created_at", { ascending: false });
  if (error) console.error("Error cargando vendedores:", error);
  return (data as VendedorRow[]) ?? [];
}

export async function fetchPropuestaCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from(PROPUESTAS_TABLE).select("vendedor_id");
  if (error) {
    console.error("Error cargando propuestas:", error);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.vendedor_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function setEstadoVendedor(id: string, estado: EstadoVendedor): Promise<boolean> {
  const { error } = await supabase.from(VENDEDORES_TABLE).update({ estado }).eq("id", id);
  if (error) {
    console.error("Error actualizando vendedor:", error);
    return false;
  }
  return true;
}
