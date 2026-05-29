import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { AdminVisitList } from "@/components/admin/AdminVisitList";
import { lots } from "@/data/lots";
import { visitRequests } from "@/data/visitRequests";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-stone-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-base font-black text-ink">
            Aglir Propiedades
          </a>
          <span className="text-sm font-bold text-stone-600">Panel admin</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
        <section>
          <h1 className="text-3xl font-black text-ink">Panel de visitas</h1>
          <p className="mt-2 max-w-2xl text-stone-700">
            Revisión de solicitudes mock y preparación manual de mensajes por WhatsApp.
          </p>
        </section>

        <AdminCalendarView requests={visitRequests} lots={lots} />
        <AdminVisitList initialRequests={visitRequests} lots={lots} />
      </div>
    </main>
  );
}
