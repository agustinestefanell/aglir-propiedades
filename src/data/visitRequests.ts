import type { VisitRequest } from "@/types";

export const visitRequests: VisitRequest[] = [
  {
    id: "vis-001",
    nombre: "Camila Rodriguez",
    whatsapp: "59891234567",
    lotId: "m1-s1",
    fecha: "2026-06-01",
    hora: "10:30",
    comentario: "Prefiere visita de manana.",
    estado: "pendiente"
  },
  {
    id: "vis-002",
    nombre: "Martin Silva",
    whatsapp: "59898765432",
    lotId: "m2-s5",
    fecha: "2026-06-01",
    hora: "16:00",
    estado: "pendiente"
  },
  {
    id: "vis-003",
    nombre: "Laura Pereira",
    whatsapp: "59895678123",
    lotId: "m1-s2",
    fecha: "2026-06-02",
    hora: "11:00",
    comentario: "Consulta por financiacion.",
    estado: "aceptada"
  },
  {
    id: "vis-004",
    nombre: "Diego Acosta",
    whatsapp: "59894444555",
    lotId: "m2-s4",
    fecha: "2026-06-03",
    hora: "15:30",
    estado: "realizada"
  }
];
