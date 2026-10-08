"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { LotStatusMenu } from "@/components/admin/LotStatusMenu";
import { AdminPriceTable } from "@/components/admin/AdminPriceTable";
import { AdminStatusSummary } from "@/components/admin/AdminStatusSummary";
import { AdminVendedores } from "@/components/admin/AdminVendedores";
import { AdminRankingTerrenos } from "@/components/admin/AdminRankingTerrenos";
import { VendedorProfileModal } from "@/components/admin/VendedorProfileModal";
import { loadVendedor } from "@/lib/vendedor";
import { useLotStates } from "@/lib/lotStates";

const SESSION_KEY = "aglir_gestion_user";
// sessionStorage: "Omitir por ahora" silencia el pedido de logo hasta cerrar el navegador
const LOGO_SKIP_KEY = "aglir_logo_omitido";

function needsLogoPrompt(): boolean {
  if (sessionStorage.getItem(LOGO_SKIP_KEY)) return false;
  return !loadVendedor()?.logo;
}

type Tab = "plano" | "ranterr" | "terrenos" | "vendedores";

export default function GestionPage() {
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lots, changeStatus, savePrices] = useLotStates();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("plano");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [profileModal, setProfileModal] = useState<"login" | "edit" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    setUser(saved);
    setAuthChecked(true);
    // La sesión persiste en localStorage: también pedir el logo al volver a abrir /gestion ya logueado
    if (saved && needsLogoPrompt()) setProfileModal("login");
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

  function handleLogin(username: string) {
    localStorage.setItem(SESSION_KEY, username);
    setUser(username);
    if (needsLogoPrompt()) setProfileModal("login");
  }

  // "Omitir por ahora" (o ✕) en el pedido de logo del login
  function skipLogoPrompt() {
    sessionStorage.setItem(LOGO_SKIP_KEY, "1");
    setProfileModal(null);
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
        {/* Row 1: logo + ADMIN + notif + logout */}
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Aglir Propiedades"
              className="h-8 w-8 rounded-sm object-cover"
            />
            <span className="hidden text-sm font-black tracking-tight text-ink sm:inline">
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
              onClick={() => setProfileModal("edit")}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-[11px] font-bold text-stone-600 transition hover:bg-stone-50"
            >
              Editar mi perfil
            </button>
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
            onClick={() => setActiveTab("ranterr")}
            className={`flex-1 border-b-2 pb-2 text-sm font-bold transition ${
              activeTab === "ranterr"
                ? "border-leaf text-leaf"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            RanTerr
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terrenos")}
            className={`flex-1 border-b-2 pb-2 text-sm font-bold transition ${
              activeTab === "terrenos"
                ? "border-leaf text-leaf"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Terrenos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vendedores")}
            className={`flex-1 border-b-2 pb-2 text-sm font-bold transition ${
              activeTab === "vendedores"
                ? "border-leaf text-leaf"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Vendedores
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
              lot={lots.find((l) => l.id === selectedLot.id) ?? selectedLot}
              onChangeStatus={(status) => handleChangeStatus(selectedLot.id, status)}
              onSavePrices={savePrices}
              onClose={() => setSelectedLot(null)}
            />
          )}
        </>
      )}

      {/* ── Tab: RanTerr (ranking de terrenos por propuestas) ─────────── */}
      {activeTab === "ranterr" && <AdminRankingTerrenos lots={lots} />}

      {/* ── Tab: Terrenos (precios) ──────────────────────────────────── */}
      {activeTab === "terrenos" && (
        <>
          <AdminStatusSummary lots={lots} />
          <AdminPriceTable lots={lots} onSavePrices={savePrices} />
        </>
      )}

      {/* ── Tab: Vendedores ──────────────────────────────────────────── */}
      {activeTab === "vendedores" && <AdminVendedores />}

      {profileModal && (
        <VendedorProfileModal
          initial={loadVendedor()}
          onSaved={() => setProfileModal(null)}
          onClose={profileModal === "login" ? skipLogoPrompt : () => setProfileModal(null)}
          onSkip={profileModal === "login" ? skipLogoPrompt : undefined}
        />
      )}
    </main>
  );
}
