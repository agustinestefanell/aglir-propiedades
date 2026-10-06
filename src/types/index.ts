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
  // Precios cargados desde admin (lot_states.precio_ur / lot_states.precio_contado), texto libre tal como se tipea
  precio_ur?: string;
  precio_contado_usd?: string;
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

export type User = {
  nombre: string;
  whatsapp: string;
};
