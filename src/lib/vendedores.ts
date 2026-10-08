import type { Lot } from "@/types";
import { supabase } from "./supabase";
import { loadVendedor, saveVendedor } from "./vendedor";

// Esquema asumido (OE 040 + OE 042) — ver handoff.md para el SQL de verificación:
//   vendedores: id, nombre, telefono, mail, pin, estado ("pendiente" | "activo" | "inactivo" | "archivado"),
//               rol ("dueno" | "vendedor"), dueno_id (FK vendedores.id), logo_inmobiliaria (data URL), created_at
//   propuestas: id, vendedor_id, lot_id, manzana, solar, created_at
export const VENDEDORES_TABLE = "vendedores";
export const PROPUESTAS_TABLE = "propuestas";

export const SESSION_KEY = "aglir_vendedor_session";
// Marca que este dispositivo ya registró un vendedor → /vendedores abre en Login en vez de Registro
export const REGISTRADO_KEY = "aglir_vendedor_registrado";

// archivado (OE 048): sin acceso y oculto por defecto en /gestion; solo se sale desarchivando (→ inactivo)
export type EstadoVendedor = "pendiente" | "activo" | "inactivo" | "archivado";
export type RolVendedor = "dueno" | "vendedor";

export type VendedorRow = {
  id: string;
  nombre: string;
  telefono: string;
  mail: string | null;
  estado: EstadoVendedor;
  rol: RolVendedor | null;
  dueno_id: string | null;
  logo_inmobiliaria?: string | null;
  pin?: string;
  created_at?: string;
};

export type VendedorSession = {
  id: string;
  nombre: string;
  telefono: string;
  mail: string | null;
  rol: RolVendedor;
  dueno_id: string | null;
};

export type PropuestaRow = {
  id: string;
  vendedor_id: string;
  lot_id: string;
  manzana: string;
  solar: string;
  created_at: string;
};

const SESSION_COLS = "id, nombre, telefono, mail, rol, dueno_id, logo_inmobiliaria";

// ── Sesión (localStorage) ───────────────────────────────────────────────────

export function loadSession(): VendedorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as VendedorSession;
    // Sesiones creadas antes de OE 042 no tienen rol
    return { ...s, rol: s.rol ?? "vendedor", dueno_id: s.dueno_id ?? null };
  } catch {
    return null;
  }
}

// Siembra el perfil que usa /propuesta?modo=vendedor.
// logo: el de la inmobiliaria (Dueño) si existe; si no, se conserva el logo local que hubiera.
export function saveSession(s: VendedorSession, logo?: string | null) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  syncPerfilPropuesta(s, logo);
}

export function syncPerfilPropuesta(s: VendedorSession, logo?: string | null) {
  const prev = loadVendedor();
  saveVendedor({ nombre: s.nombre, telefono: s.telefono, logo: logo || prev?.logo });
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Registro ────────────────────────────────────────────────────────────────

export type RegistroResult = "ok" | "pin_en_uso" | "error";

// El login es solo por PIN, así que dos vendedores no pueden compartirlo
async function pinEnUso(pin: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("id")
    .eq("pin", pin)
    .limit(1);
  if (error) console.error("Error verificando PIN:", error);
  return !!data && data.length > 0;
}

export async function registrarVendedor(data: {
  nombre: string;
  telefono: string;
  mail: string;
  pin: string;
  rol: RolVendedor;
  logo_inmobiliaria?: string;
}): Promise<RegistroResult> {
  if (await pinEnUso(data.pin)) return "pin_en_uso";

  const { error } = await supabase.from(VENDEDORES_TABLE).insert({
    nombre: data.nombre,
    telefono: data.telefono,
    mail: data.mail,
    pin: data.pin,
    rol: data.rol,
    logo_inmobiliaria: data.rol === "dueno" ? data.logo_inmobiliaria ?? null : null,
    estado: "pendiente",
  });
  if (error) {
    console.error("Error registrando vendedor:", error);
    return "error";
  }

  fetch("/api/push/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.rol === "dueno" ? "Nuevo dueño de inmobiliaria registrado" : "Nuevo vendedor registrado",
      body: `${data.nombre} · ${data.telefono}`,
      url: "/gestion",
    }),
  }).catch(() => {});

  return "ok";
}

// ── Login ───────────────────────────────────────────────────────────────────

type DuenoInfo = { estado: EstadoVendedor; logo_inmobiliaria: string | null };

async function fetchDueno(id: string): Promise<DuenoInfo | null> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("estado, logo_inmobiliaria")
    .eq("id", id)
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0] as DuenoInfo;
}

export type LoginResult = { session: VendedorSession; logo: string | null } | null;

export async function loginPorPin(pin: string): Promise<LoginResult> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select(SESSION_COLS)
    .eq("pin", pin)
    .eq("estado", "activo")
    .limit(1);
  if (error) {
    console.error("Error en login de vendedor:", error);
    return null;
  }
  const row = data?.[0] as VendedorRow | undefined;
  if (!row) return null;

  const session: VendedorSession = {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    mail: row.mail,
    rol: row.rol ?? "vendedor",
    dueno_id: row.dueno_id,
  };

  // Vendedor de un equipo: el Dueño tiene que estar activo, y su logo va en las propuestas
  if (session.dueno_id) {
    const dueno = await fetchDueno(session.dueno_id);
    if (!dueno || dueno.estado !== "activo") return null;
    return { session, logo: dueno.logo_inmobiliaria };
  }
  return { session, logo: session.rol === "dueno" ? row.logo_inmobiliaria ?? null : null };
}

// Re-chequeo al abrir el dashboard. activo=null → no se pudo determinar (error/RLS): no forzar logout.
export async function fetchContextoSesion(
  s: VendedorSession
): Promise<{ activo: boolean | null; logo: string | null }> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("estado, logo_inmobiliaria")
    .eq("id", s.id)
    .limit(1);
  if (error || !data || data.length === 0) return { activo: null, logo: null };
  const propio = data[0] as DuenoInfo;
  if (propio.estado !== "activo") return { activo: false, logo: null };

  if (s.dueno_id) {
    const dueno = await fetchDueno(s.dueno_id);
    if (!dueno) return { activo: null, logo: null };
    return { activo: dueno.estado === "activo", logo: dueno.logo_inmobiliaria };
  }
  return { activo: true, logo: s.rol === "dueno" ? propio.logo_inmobiliaria : null };
}

// ── Propuestas ──────────────────────────────────────────────────────────────

// Registro de interés por terreno (futuro ranking de lotes más consultados)
export async function registrarPropuesta(vendedorId: string, lot: Lot): Promise<void> {
  const { error } = await supabase.from(PROPUESTAS_TABLE).insert({
    vendedor_id: vendedorId,
    lot_id: lot.id,
    manzana: lot.manzana,
    solar: lot.solar,
  });
  if (error) console.error("Error registrando propuesta:", error);
}

// ── Dueño: su equipo ────────────────────────────────────────────────────────

export async function fetchEquipo(duenoId: string): Promise<VendedorRow[]> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("id, nombre, telefono, mail, estado, rol, dueno_id, pin, created_at")
    .eq("dueno_id", duenoId)
    .order("created_at", { ascending: true });
  if (error) console.error("Error cargando equipo:", error);
  return (data as VendedorRow[]) ?? [];
}

// message: texto de Supabase cuando status = "error", para mostrarlo en pantalla
export type CrearVendedorResult = { status: RegistroResult; message?: string };

export async function crearVendedorEquipo(
  duenoId: string,
  data: { nombre: string; telefono: string; mail: string; pin: string }
): Promise<CrearVendedorResult> {
  if (await pinEnUso(data.pin)) return { status: "pin_en_uso" };
  // Lo crea el Dueño → queda activo sin pasar por aprobación de admin
  const { error } = await supabase.from(VENDEDORES_TABLE).insert({
    nombre: data.nombre,
    telefono: data.telefono,
    mail: data.mail.trim() || null,
    pin: data.pin,
    rol: "vendedor",
    dueno_id: duenoId,
    estado: "activo",
  });
  if (error) {
    console.error("Error creando vendedor del equipo:", error);
    return { status: "error", message: error.message };
  }
  return { status: "ok" };
}

export async function fetchPropuestas(vendedorIds: string[]): Promise<PropuestaRow[]> {
  if (vendedorIds.length === 0) return [];
  const { data, error } = await supabase
    .from(PROPUESTAS_TABLE)
    .select("id, vendedor_id, lot_id, manzana, solar, created_at")
    .in("vendedor_id", vendedorIds)
    .order("created_at", { ascending: false });
  if (error) console.error("Error cargando propuestas del equipo:", error);
  return (data as PropuestaRow[]) ?? [];
}

// ── Admin ───────────────────────────────────────────────────────────────────

export async function fetchVendedores(): Promise<VendedorRow[]> {
  const { data, error } = await supabase
    .from(VENDEDORES_TABLE)
    .select("id, nombre, telefono, mail, estado, rol, dueno_id, logo_inmobiliaria, created_at")
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
  return countBy((data ?? []).map((r) => r.vendedor_id as string));
}

// Ranking de terrenos (tab RanTerr): count(*) group by lot_id. PostgREST no agrupa sin
// habilitar aggregates en Supabase, así que se cuenta en el cliente (una fila por propuesta).
export async function fetchPropuestaCountsPorLote(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from(PROPUESTAS_TABLE).select("lot_id");
  if (error) {
    console.error("Error cargando propuestas por terreno:", error);
    return {};
  }
  return countBy((data ?? []).map((r) => r.lot_id as string).filter(Boolean));
}

export function countBy(ids: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
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
