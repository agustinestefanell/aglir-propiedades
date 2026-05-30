import type { Lot } from "@/types";

type BuildUrlInput = {
  phone: string;
  nombre: string;
  terreno: Lot;
  fecha: string;
  hora: string;
};

export function buildWhatsAppUrl({ phone, nombre, terreno, fecha, hora }: BuildUrlInput) {
  const cleanPhone = phone.replace(/\D/g, "");
  const message = `Hola ${nombre}, ¿cómo estás?

Te confirmamos la visita para ver el terreno Manzana ${terreno.manzana}, Solar ${terreno.solar}, de ${terreno.area_m2} m², el día ${fecha} a las ${hora}.

Aglir Propiedades.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Formato de contacto para guardar en agenda: AP-[número][Nombre]
 * Ej: AP-59891234567Camila Rodriguez
 */
export function formatContactName(nombre: string, whatsapp: string): string {
  const cleanPhone = whatsapp.replace(/\D/g, "");
  return `AP-${cleanPhone}${nombre}`;
}
