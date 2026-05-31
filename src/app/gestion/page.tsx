"use client";

import { useEffect, useState } from "react";
import { lots as initialLots } from "@/data/lots";
import type { Lot, LotStatus } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { LotStatusMenu } from "@/components/admin/LotStatusMenu";

const SESSION_KEY = "aglir_gestion_user";

export default function GestionPage() {
  const [user, setUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lots, setLots] = useState<Lot[]>(initialLots);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [statusMenu, setStatusMenu] = useState<{
    lot: Lot;
    x: number;
    y: number;
  } | null>(null);

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

  function handleChangeStatus(lotId: string, status: LotStatus) {
    setLots((cur) =>
      cur.map((l) => (l.id === lotId ? { ...l, estado: status } : l))
    );
    setStatusMenu(null);
  }

  function handleLotDoubleClick(lot: Lot, clientX: number, clientY: number) {
    const current = lots.find((l) => l.id === lot.id) ?? lot;
    setStatusMenu({ lot: current, x: clientX, y: clientY });
  }

  if (!authChecked) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black tracking-tight text-ink">
            Aglir — Admin
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-500">{user}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <InteractivePlan
        lots={lots}
        selectedLot={selectedLot}
        onSelectLot={setSelectedLot}
        onSchedule={() => undefined}
        showLotDetails={false}
        isAdmin
        onLotDoubleClick={handleLotDoubleClick}
      />

      {statusMenu && (
        <LotStatusMenu
          lot={statusMenu.lot}
          position={{ x: statusMenu.x, y: statusMenu.y }}
          onChangeStatus={(status) => handleChangeStatus(statusMenu.lot.id, status)}
          onClose={() => setStatusMenu(null)}
        />
      )}
    </main>
  );
}
