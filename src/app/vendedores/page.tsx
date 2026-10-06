"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Lot } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { useLotStates } from "@/lib/lotStates";
import {
  REGISTRADO_KEY,
  clearSession,
  fetchEstadoVendedor,
  loadSession,
  loginPorPin,
  registrarPropuesta,
  registrarVendedor,
  saveSession,
  type VendedorSession,
} from "@/lib/vendedores";

type View = "registro" | "enviado" | "login";

const inputCls =
  "mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm font-normal text-ink";

function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.jpg" alt="Aglir Propiedades" className="h-8 w-8 rounded-sm object-cover" />
  );
}

// ── Registro ────────────────────────────────────────────────────────────────

function RegistroForm({ onDone, onGoLogin }: { onDone: () => void; onGoLogin: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !mail.trim()) {
      setError("Completá todos los campos.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener 4 dígitos.");
      return;
    }
    setSending(true);
    setError(null);
    const result = await registrarVendedor({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      mail: mail.trim(),
      pin,
    });
    setSending(false);
    if (result === "pin_en_uso") setError("Ese PIN ya está en uso. Elegí otro.");
    else if (result === "error") setError("No se pudo enviar la solicitud. Intentá de nuevo.");
    else onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <h1 className="text-xl font-black text-ink">Registro de vendedores</h1>
      <label className="text-xs font-semibold text-stone-600">
        Nombre
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
      </label>
      <label className="text-xs font-semibold text-stone-600">
        Teléfono
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls} />
      </label>
      <label className="text-xs font-semibold text-stone-600">
        Mail
        <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} className={inputCls} />
      </label>
      <label className="text-xs font-semibold text-stone-600">
        PIN (4 dígitos)
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className={`${inputCls} tracking-[0.5em]`}
        />
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="mt-1 w-full rounded-md bg-leaf py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {sending ? "Enviando…" : "Registrarme"}
      </button>
      <button type="button" onClick={onGoLogin} className="text-xs text-stone-500 underline">
        Ya estoy registrado — Ingresar con PIN
      </button>
    </form>
  );
}

// ── Login ───────────────────────────────────────────────────────────────────

function LoginForm({
  onLogin,
  onGoRegistro,
}: {
  onLogin: (s: VendedorSession) => void;
  onGoRegistro: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener 4 dígitos.");
      return;
    }
    setLoading(true);
    setError(null);
    const session = await loginPorPin(pin);
    setLoading(false);
    if (!session) {
      setError("PIN incorrecto o cuenta pendiente de aprobación");
      return;
    }
    onLogin(session);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <h1 className="text-xl font-black text-ink">Ingreso de vendedores</h1>
      <label className="text-xs font-semibold text-stone-600">
        PIN
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className={`${inputCls} text-center text-2xl tracking-[0.75em]`}
        />
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full rounded-md bg-leaf py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Verificando…" : "Ingresar"}
      </button>
      <button type="button" onClick={onGoRegistro} className="text-xs text-stone-500 underline">
        No tengo cuenta — Registrarme
      </button>
    </form>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ session, onLogout }: { session: VendedorSession; onLogout: () => void }) {
  const router = useRouter();
  const [lots] = useLotStates();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [generating, setGenerating] = useState(false);

  // Si el admin desactivó la cuenta, cerrar sesión (null = no se pudo verificar → se mantiene)
  useEffect(() => {
    fetchEstadoVendedor(session.id).then((estado) => {
      if (estado && estado !== "activo") onLogout();
    });
  }, [session.id, onLogout]);

  const lot = selectedLot ? lots.find((l) => l.id === selectedLot.id) ?? selectedLot : null;

  async function handleGenerar() {
    if (!lot) return;
    setGenerating(true);
    await registrarPropuesta(session.id, lot);
    router.push(`/propuesta/${lot.id}?modo=vendedor`);
  }

  return (
    <main className="min-h-screen bg-paper pb-10">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <span className="truncate text-sm font-black text-ink">{session.nombre}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
          >
            Salir
          </button>
        </div>
      </header>

      <p className="mx-auto max-w-[430px] px-4 pt-2 pb-1 text-center text-xs text-stone-500">
        Tocá un solar disponible para generar una propuesta
      </p>

      <InteractivePlan
        lots={lots}
        selectedLot={lot}
        onSelectLot={setSelectedLot}
        onSchedule={() => undefined}
        showLotDetails={false}
      />

      {lot && lot.estado === "disponible" && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedLot(null)} />
          <aside className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-2xl bg-white px-5 pt-4 pb-8 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-ink">
                  Manzana {lot.manzana} · Solar {lot.solar}
                </h2>
                {lot.area_m2 > 0 && <p className="text-sm text-stone-500">{lot.area_m2} m²</p>}
                {lot.precio_ur && (
                  <p className="text-sm font-bold text-ink">Precio: UR {lot.precio_ur}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedLot(null)}
                aria-label="Cerrar"
                className="min-h-9 min-w-9 rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerar}
              disabled={generating}
              className="w-full rounded-md bg-leaf py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {generating ? "Generando…" : "Generar propuesta"}
            </button>
          </aside>
        </>
      )}
    </main>
  );
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function VendedoresPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<VendedorSession | null>(null);
  const [view, setView] = useState<View>("registro");

  useEffect(() => {
    setSession(loadSession());
    if (localStorage.getItem(REGISTRADO_KEY)) setView("login");
    setReady(true);
  }, []);

  function handleLogin(s: VendedorSession) {
    saveSession(s);
    localStorage.setItem(REGISTRADO_KEY, "1");
    setSession(s);
  }

  // Estable: Dashboard lo usa como dependencia de su effect
  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setView("login");
  }, []);

  if (!ready) return null;
  if (session) return <Dashboard session={session} onLogout={handleLogout} />;

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[430px] px-5 pt-8 pb-10">
        <div className="mb-6 flex items-center gap-2.5">
          <Logo />
          <span className="text-sm font-black tracking-tight text-ink">Aglir Propiedades</span>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          {view === "registro" && (
            <RegistroForm
              onDone={() => {
                localStorage.setItem(REGISTRADO_KEY, "1");
                setView("enviado");
              }}
              onGoLogin={() => setView("login")}
            />
          )}
          {view === "enviado" && (
            <div className="grid gap-4 text-center">
              <p className="text-base font-bold text-ink">
                Tu solicitud fue enviada. Te avisamos cuando esté aprobada.
              </p>
              <button type="button" onClick={() => setView("login")} className="text-xs text-stone-500 underline">
                Ir al ingreso con PIN
              </button>
            </div>
          )}
          {view === "login" && (
            <LoginForm onLogin={handleLogin} onGoRegistro={() => setView("registro")} />
          )}
        </div>
      </div>
    </main>
  );
}
