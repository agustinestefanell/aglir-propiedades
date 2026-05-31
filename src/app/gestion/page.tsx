"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { LotStatusMenu } from "@/components/admin/LotStatusMenu";
import { useLotStates } from "@/lib/lotStates";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "aglir_gestion_user";

type Tab = "plano" | "visitas";

type VisitRow = {
  id: string;
  nombre: string;
  whatsapp: string;
  manzana: string;
  solar: string;
  dia_hora: string;
  comentario?: string;
  estado?: string;
};

function buildWAUrl(v: VisitRow): string {
  const phone = v.whatsapp.replace(/\D/g, "");
  const fullPhone = phone.startsWith("598") ? phone : `598${phone}`;
  const msg = encodeURIComponent(
    `Hola ${v.nombre}, confirmamos tu visita al Solar ${v.solar} de la Manzana ${v.manzana} para el ${v.dia_hora}. ¡Hasta pronto! — Aglir Propiedades`
  );
  return `https://wa.me/${fullPhone}?text=${msg}`;
}

async function fetchVisits(): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from("visit_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) console.error("Error cargando visitas:", error);
  return (data as VisitRow[]) ?? [];
}

export default function GestionPage() {
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lots, changeStatus] = useLotStates();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("plano");
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  const pendingCount = visits.filter(
    (v) => !v.estado || v.estado === "pendiente"
  ).length;

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    setUser(saved);
    setAuthChecked(true);
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const subscribePush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      }));
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub }),
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    subscribePush().catch(() => {});
  }, [user, subscribePush]);

  useEffect(() => {
    if (!user) return;

    fetchVisits().then(setVisits);

    const channel = supabase
      .channel("visit_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visit_requests" },
        () => { fetchVisits().then(setVisits); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  function handleLogin(username: string) {
    localStorage.setItem(SESSION_KEY, username);
    setUser(username);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  function handleSelectLot(lot: Lot | null) {
    if (!lot) { setSelectedLot(null); return; }
    const current = lots.find((l) => l.id === lot.id) ?? lot;
    setSelectedLot(current);
  }

  function handleChangeStatus(lotId: string, status: LotStatus) {
    changeStatus(lotId, status);
    setSelectedLot((prev) =>
      prev?.id === lotId ? { ...prev, estado: status } : prev
    );
  }

  async function confirmVisit(id: string) {
    const { error } = await supabase
      .from("visit_requests")
      .update({ estado: "confirmada" })
      .eq("id", id);
    if (error) {
      console.error("Error confirmando visita:", error);
    } else {
      setVisits((prev) =>
        prev.map((v) => v.id === id ? { ...v, estado: "confirmada" } : v)
      );
    }
  }

  if (!authChecked) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <main className="min-h-screen bg-paper pb-10">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        {/* Row 1: logo + ADMIN + notif + logout */}
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Aglir Propiedades"
              className="h-8 w-8 rounded-sm object-cover"
            />
            <span className="text-sm font-black tracking-tight text-ink">
              Aglir Propiedades
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-stone-800 px-2 py-0.5 text-[11px] font-black tracking-widest text-stone-800">
              ADMIN
            </span>
            {notifPermission !== "granted" && (
              <button
                type="button"
                onClick={() => subscribePush().catch(() => {})}
                className="rounded-md bg-leaf px-2 py-1 text-[10px] font-bold text-white"
                title="Activar notificaciones push"
              >
                🔔 Notif
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Row 2: tabs */}
        <div className="mx-auto flex max-w-[430px] gap-0 px-4">
          <button
            type="button"
            onClick={() => setActiveTab("plano")}
            className={`flex-1 border-b-2 pb-2 text-sm font-bold transition ${
              activeTab === "plano"
                ? "border-leaf text-leaf"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Plano
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visitas")}
            className={`flex-1 border-b-2 pb-2 text-sm font-bold transition ${
              activeTab === "visitas"
                ? "border-leaf text-leaf"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Visitas{pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-leaf px-1.5 py-0.5 text-[10px] font-black text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Tab: Plano ───────────────────────────────────────────────── */}
      {activeTab === "plano" && (
        <>
          {/* Legend */}
          <div className="mx-auto max-w-[430px] px-4 pt-2 pb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-stone-500 bg-transparent" />
              <span className="font-semibold">Disponible</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="font-semibold">Reservado</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-yellow-400" />
              <span className="font-semibold">Vendido</span>
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500">Tocá un solar para cambiar su estado</span>
          </div>

          <InteractivePlan
            lots={lots}
            selectedLot={selectedLot}
            onSelectLot={handleSelectLot}
            onSchedule={() => undefined}
            showLotDetails={false}
            isAdmin
          />

          {selectedLot && (
            <LotStatusMenu
              lot={selectedLot}
              onChangeStatus={(status) => handleChangeStatus(selectedLot.id, status)}
              onClose={() => setSelectedLot(null)}
            />
          )}
        </>
      )}

      {/* ── Tab: Visitas ─────────────────────────────────────────────── */}
      {activeTab === "visitas" && (
        <section className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-6">
          {visits.length === 0 ? (
            <p className="pt-8 text-center text-sm text-stone-500">
              Sin solicitudes aún.
            </p>
          ) : (
            <div className="grid gap-3">
              {visits.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-ink">{v.nombre}</p>
                      <p className="text-xs text-stone-500">{v.whatsapp}</p>
                      <p className="mt-1 text-xs font-semibold text-stone-700">
                        M{v.manzana} · S{v.solar}
                      </p>
                      <p className="text-xs text-stone-500">{v.dia_hora}</p>
                      {v.comentario && (
                        <p className="mt-1 text-xs italic text-stone-400">{v.comentario}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        v.estado === "confirmada"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {v.estado ?? "pendiente"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={buildWAUrl(v)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-md bg-[#25D366] py-2 text-center text-xs font-bold text-white"
                    >
                      WhatsApp
                    </a>
                    {v.estado !== "confirmada" && (
                      <button
                        type="button"
                        onClick={() => confirmVisit(v.id)}
                        className="flex-1 rounded-md bg-leaf py-2 text-xs font-bold text-white"
                      >
                        Confirmar
                      </button>
                    )}
                    {v.estado === "confirmada" && (
                      <span className="flex flex-1 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700">
                        ✓ Confirmada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
