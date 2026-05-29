import type { Lot } from "@/types";

type BuildWhatsAppUrlInput = {
  phone: string;
  nombre: string;
  terreno: Lot;
  fecha: string;
  hora: string;
};

export function buildWhatsAppUrl({
  phone,
  nombre,
  terreno,
  fecha,
  hora
}: BuildWhatsAppUrlInput) {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const message = `Hola ${nombre}, ¿cómo estás?

Te confirmamos la visita para ver el terreno Manzana ${terreno.manzana}, Solar ${terreno.solar}, de ${terreno.area_m2} m², el día ${fecha} a las ${hora}.

Aglir Propiedades.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
