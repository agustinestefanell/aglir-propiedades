"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { LotStatusMenu } from "@/components/admin/LotStatusMenu";
import { useLotStates } from "@/lib/lotStates";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "aglir_gestion_user";

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

function buildCalendarUrl(v: VisitRow): string {
  const [date, time = "09:00"] = v.dia_hora.split(" ");
  const [y, m, d] = date.split("-");
  const [h, min] = time.split(":");
  const pad = (n: string) => n.padStart(2, "0");
  const start = `${y}${m}${d}T${pad(h)}${pad(min)}00`;
  const endH = String(Number(h) + 1).padStart(2, "0");
  const end = `${y}${m}${d}T${endH}${pad(min)}00`;
  const text = encodeURIComponent(`Visita Aglir M${v.manzana} S${v.solar}`);
  const details = encodeURIComponent(`Cliente: ${v.nombre} · WA: ${v.whatsapp}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${start}/${end}`;
}

export default function GestionPage() {
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lots, changeStatus] = useLotStates();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

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
    supabase
      .from("visit_requests")
      .select("*")
      .then(({ data }) => setVisits((data as VisitRow[]) ?? []));
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

  if (!authChecked) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <main className="min-h-screen bg-paper pb-10">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        {/* Row 1: logo + ADMIN + notif button + logout */}
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

        {/* Row 2: legend */}
        <div className="mx-auto max-w-[430px] px-4 pb-2 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
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
      </header>

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

      {/* ── Visitas recibidas ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[430px] px-4 pt-6">
        <h2 className="mb-3 text-base font-black text-ink">
          Visitas recibidas{visits.length > 0 && ` (${visits.length})`}
        </h2>

        {visits.length === 0 ? (
          <p className="text-sm text-stone-500">Sin solicitudes aún.</p>
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
                      M{v.manzana} · S{v.solar} · {v.dia_hora}
                    </p>
                    {v.comentario && (
                      <p className="mt-1 text-xs text-stone-500 italic">{v.comentario}</p>
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
                  <a
                    href={buildCalendarUrl(v)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-md border border-stone-300 bg-white py-2 text-center text-xs font-bold text-stone-700"
                  >
                    📅 Calendar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
