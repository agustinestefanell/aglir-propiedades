import type { Lot } from "@/types";

export const lots: Lot[] = [
  {
    id: "m1-s1",
    manzana: "1",
    solar: "1",
    area_m2: 420,
    precio_contado: 24500,
    precio_financiado: 28500,
    estado: "disponible",
    observaciones: "Frente amplio, buen acceso desde calle principal.",
    polygon: [
      { x: 12, y: 20 },
      { x: 29, y: 18 },
      { x: 31, y: 34 },
      { x: 14, y: 36 }
    ]
  },
  {
    id: "m1-s2",
    manzana: "1",
    solar: "2",
    area_m2: 405,
    precio_contado: 23800,
    precio_financiado: 27800,
    estado: "disponible",
    observaciones: "Ubicado cerca del ingreso al fraccionamiento.",
    polygon: [
      { x: 31, y: 18 },
      { x: 48, y: 17 },
      { x: 49, y: 33 },
      { x: 32, y: 34 }
    ]
  },
  {
    id: "m1-s3",
    manzana: "1",
    solar: "3",
    area_m2: 390,
    precio_contado: 22600,
    precio_financiado: 26700,
    estado: "reservado",
    observaciones: "Reserva en curso, consultar disponibilidad.",
    polygon: [
      { x: 50, y: 17 },
      { x: 66, y: 18 },
      { x: 65, y: 34 },
      { x: 50, y: 33 }
    ]
  },
  {
    id: "m2-s4",
    manzana: "2",
    solar: "4",
    area_m2: 450,
    precio_contado: 25500,
    precio_financiado: 29900,
    estado: "disponible",
    observaciones: "Solar esquina con orientación favorable.",
    polygon: [
      { x: 16, y: 50 },
      { x: 34, y: 48 },
      { x: 36, y: 65 },
      { x: 17, y: 67 }
    ]
  },
  {
    id: "m2-s5",
    manzana: "2",
    solar: "5",
    area_m2: 430,
    precio_contado: 24900,
    precio_financiado: 29200,
    estado: "disponible",
    observaciones: "Terreno regular, apto para vivienda familiar.",
    polygon: [
      { x: 37, y: 48 },
      { x: 54, y: 47 },
      { x: 55, y: 64 },
      { x: 37, y: 65 }
    ]
  },
  {
    id: "m2-s6",
    manzana: "2",
    solar: "6",
    area_m2: 410,
    precio_contado: 23200,
    precio_financiado: 27400,
    estado: "vendido",
    observaciones: "Vendido. Se mantiene como referencia visual.",
    polygon: [
      { x: 56, y: 47 },
      { x: 72, y: 49 },
      { x: 71, y: 66 },
      { x: 56, y: 64 }
    ]
  }
];
