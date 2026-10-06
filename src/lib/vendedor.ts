export const VENDEDOR_KEY = "aglir_vendedor";

export type Vendedor = {
  nombre: string;
  telefono: string;
  logo?: string; // data URL (JPEG redimensionado) — vive solo en el dispositivo del vendedor
};

export function loadVendedor(): Vendedor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VENDEDOR_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Vendedor;
    return v && v.nombre ? v : null;
  } catch {
    return null;
  }
}

export function saveVendedor(v: Vendedor): boolean {
  try {
    localStorage.setItem(VENDEDOR_KEY, JSON.stringify(v));
    return true;
  } catch (e) {
    // QuotaExceededError si el logo es muy grande
    console.error("Error guardando perfil de vendedor:", e);
    return false;
  }
}

// Redimensiona la imagen elegida a un lado máximo de `max` px y la devuelve como data URL JPEG,
// para que entre holgada en localStorage (~5 MB por origen).
export function fileToResizedDataUrl(file: File, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.onload = () => {
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible"));
        // Fondo blanco: los PNG con transparencia quedarían negros al pasar a JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
