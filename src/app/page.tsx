"use client";

import { useState } from "react";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { VisitBookingModal } from "@/components/visits/VisitBookingModal";
import { lots } from "@/data/lots";
import type { Lot, VisitRequest } from "@/types";

export default function Home() {
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [bookingLot, setBookingLot] = useState<Lot | null>(null);
  const [, setRequests] = useState<VisitRequest[]>([]);

  function handleSchedule() {
    if (selectedLot?.estado === "disponible") {
      setBookingLot(selectedLot);
    }
  }

  function handleSubmit(data: Omit<VisitRequest, "id" | "estado">) {
    setRequests((cur) => [
      { ...data, id: `local-${Date.now()}`, estado: "pendiente" },
      ...cur,
    ]);
  }

  return (
    <main className="min-h-screen bg-paper pb-8">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-base font-black text-ink">
            Aglir Propiedades
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 pb-4 md:pt-8 md:pb-5">
        <h1 className="text-3xl font-black leading-tight text-ink md:text-4xl">
          Terrenos en Barros Blancos
        </h1>
      </div>

      <InteractivePlan
        lots={lots}
        selectedLot={selectedLot}
        onSelectLot={setSelectedLot}
        onSchedule={handleSchedule}
      />

      {bookingLot && (
        <VisitBookingModal
          lot={bookingLot}
          onClose={() => setBookingLot(null)}
          onSubmit={(data) => {
            handleSubmit(data);
          }}
        />
      )}
    </main>
  );
}
