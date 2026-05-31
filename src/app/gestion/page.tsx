"use client";

import { useEffect, useState } from "react";
import { lots as initialLots } from "@/data/lots";
import { visitRequests } from "@/data/visitRequests";
import type { Lot, LotStatus } from "@/types";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { LotStatusMenu } from "@/components/admin/LotStatusMenu";
import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { AdminVisitList } from "@/components/admin/AdminVisitList";

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
    setStatusMenu((prev) =>
      prev?.lot.id === lotId ? { ...prev, lot: { ...prev.lot, estado: status } } : prev
    );
  }

  function handleLotDoubleClick(lot: Lot, clientX: number, clientY: number) {
    const current = lots.find((l) => l.id === lot.id) ?? lot;
    setStatusMenu({ lot: current, x: clientX, y: clientY });
  }

  if (!authChecked) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <main className="min-h-screen bg-paper pb-8">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-base font-black text-ink">
            Aglir Propiedades
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-stone-600">{user}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 pb-4">
        <h1 className="text-2xl font-black text-ink">Panel de gestión</h1>
        <p className="mt-1 text-sm text-stone-500">
          Doble click en un terreno para cambiar su estado.
        </p>
      </div>

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

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
        <AdminCalendarView requests={visitRequests} lots={lots} />
        <AdminVisitList initialRequests={visitRequests} lots={lots} />
      </div>
    </main>
  );
}
