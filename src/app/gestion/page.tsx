"use client";

import { useEffect, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { LotStatusMenu } from "@/components/admin/LotStatusMenu";
import { useLotStates } from "@/lib/lotStates";

const SESSION_KEY = "aglir_gestion_user";

export default function GestionPage() {
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lots, changeStatus] = useLotStates();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    setUser(saved);
    setAuthChecked(true);
  }, []);

  function handleLogin(username: string) {
    sessionStorage.setItem(SESSION_KEY, username);
    setUser(username);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  // Single-click on lot opens the status bottom sheet directly.
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
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 pt-3 pb-2 backdrop-blur">
        {/* Row 1: logo + ADMIN badge + user + logout */}
        <div className="flex items-center justify-between gap-3">
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
            <span className="hidden text-xs font-semibold text-stone-500 sm:block">
              {user}
            </span>
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
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
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
    </main>
  );
}
