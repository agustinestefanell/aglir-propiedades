"use client";

import { useState } from "react";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import { VisitRequestForm } from "@/components/visits/VisitRequestForm";
import { lots } from "@/data/lots";
import type { Lot, VisitRequest } from "@/types";

export default function Home() {
  const [selectedLot, setSelectedLot] = useState<Lot | null>(lots[0] ?? null);
  const [, setLocalRequests] = useState<VisitRequest[]>([]);

  function handleSchedule() {
    document.getElementById("agendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-paper pb-32 md:pb-12">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-base font-black text-ink">
            Aglir Propiedades
          </a>
          <a
            href="/admin"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-700"
          >
            Admin
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 md:py-8">
        <section className="max-w-3xl">
          <h1 className="text-3xl font-black leading-tight text-ink md:text-5xl">
            Terrenos disponibles en Barros Blancos
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-700 md:text-lg">
            Tocá un terreno en el plano para ver metros, precio y agendar una visita.
          </p>
        </section>

        <InteractivePlan
          lots={lots}
          selectedLot={selectedLot}
          onSelectLot={setSelectedLot}
          onSchedule={handleSchedule}
        />

        <VisitRequestForm
          selectedLot={selectedLot}
          onCreateRequest={(request) => setLocalRequests((current) => [request, ...current])}
        />
      </div>
    </main>
  );
}
