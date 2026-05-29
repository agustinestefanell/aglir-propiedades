export type LotStatus = "disponible" | "reservado" | "vendido";

export type VisitStatus = "pendiente" | "aceptada" | "rechazada" | "realizada";

export type PolygonPoint = {
  x: number;
  y: number;
};

export type Lot = {
  id: string;
  manzana: string;
  solar: string;
  area_m2: number;
  precio_contado: number;
  precio_financiado: number;
  estado: LotStatus;
  observaciones: string;
  polygon: PolygonPoint[];
};

export type VisitRequest = {
  id: string;
  nombre: string;
  whatsapp: string;
  lotId: string;
  fecha: string;
  hora: string;
  comentario?: string;
  estado: VisitStatus;
};
