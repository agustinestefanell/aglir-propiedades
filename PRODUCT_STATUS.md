# PRODUCT_STATUS.md — Estado real de features

Estados: **Closed** (terminado) / **Partial** (funciona con limitaciones) / **UI-only** (sin logica real) / **Deferred** (postergado) / **Broken** (roto/faltante)

Ultima actualizacion: 2026-05-30 — OE 001

---

## Infraestructura

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Next.js 14 + TypeScript + Tailwind + App Router | Closed | `next build` OK, `tsc --noEmit` limpio | Verificar build en Linux antes de cada push |
| Deploy Vercel | Closed | https://aglir-propiedades.vercel.app | Re-deploy con cambios de OE 000 fase 4-5 (sin push aun) |
| GitHub remoto | Closed | origin → `agustinestefanell/aglir-propiedades.git` | — |
| Logo en public/ | Closed | `public/logo.jpg` presente | Integrar en layout.tsx |

---

## Datos

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Dataset lotes — metadata m2/solar/area | Partial | 58 lotes en `src/data/lots.ts` (manzanas 2,3,6,8,9) | Auditar manzanas 1,4,5,7; verificar recuento manzana 6 solar 14 |
| Precios reales | Broken | `precio_contado: 0` en todos los lotes | Cargar precios reales cuando se definan |
| Poligonos SVG trazados | Broken | `polygon: []` en todos los lotes | Trazar con `/admin/trace`, pegar en `lots.ts` |
| Solicitudes de visita mock | Partial | 4 registros en `visitRequests.ts` con IDs de lotes validos | Solo para probar admin; no persisten |

---

## Pagina publica `/`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Imagen real del plano | Closed | `public/plan/plano-11223.png` (4682x3311 px) | — |
| Plano con zoom/pan (rueda + drag + pinch) | Closed | `InteractivePlan` con eventos nativos, max 6x | Probar en smartphone real |
| Colores de estados en plano | Closed | disponible=sin relleno, reservado=verde, vendido=amarillo | — |
| SVG alineado con plano (viewBox correcto) | Closed | `viewBox="0 0 100 70.72"` == aspect ratio 4682/3311 | — |
| Poligonos clickeables sobre plano | Broken | Todos `polygon:[]`, ningun poligono se dibuja | Requiere trazado |
| Panel lateral de detalle (sin cerrar plano) | Partial | `LotDetailPanel` funcional | Pendiente probar con poligonos reales |
| Flujo de agenda (registro + booking) | Partial | `VisitBookingModal` 2 pasos, localStorage session | Sin persistencia backend; horario siempre "a confirmar" |
| Persistencia de solicitudes de visita | Broken | Solo en estado React de la sesion (se pierde al recargar) | Requiere backend |

---

## Panel admin `/admin`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Gestion de estados comerciales (local) | Partial | `AdminLotStatusManager` + `AdminLotStatusCard` — cambios locales por sesion | Persistencia real en backend |
| Busqueda de lotes por manzana/solar | Closed | Filtro de texto en `AdminLotStatusManager` | — |
| Vista de solicitudes mock | Partial | `AdminVisitList` con datos de `visitRequests.ts` | Conectar con solicitudes reales |
| Vista por dia (calendario simple) | Partial | `AdminCalendarView` con datos mock agrupados por fecha | Conectar con solicitudes reales |
| WhatsApp human-in-the-loop | Partial | `buildWhatsAppUrl` + apertura de `wa.me/...` | Probar con numero real |
| Formato de contacto AP-{tel}{Nombre} | Closed | `formatContactName` en `whatsapp.ts`, visible en `WhatsAppAcceptButton` | Probar flujo real |
| Autenticacion admin | Deferred | No implementado | OE especifica futura |

---

## Herramienta de trazado `/admin/trace`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Acceso restringido a desarrollo | Closed | Guard `NODE_ENV !== "development"` | — |
| Plano a pantalla completa con zoom/pan | Closed | Mismo patron que `InteractivePlan` | — |
| Click agrega vertice numerado | Closed | Punto rojo (r≈4px) + label numerico + polilinea | Probar alineacion con contenido real del plano |
| Dropdown con 58 IDs de lotes | Closed | Importa `lots` de `src/data/lots.ts` | — |
| Cerrar poligono + copiar al clipboard | Closed | `navigator.clipboard.writeText`; zoom/pan no se resetea con ninguna accion de boton | — |
| Persistencia de trazados en localStorage | Closed | `aglir_trace_polygons` — sobrevive refresh y reinicio del servidor; restaura por lote | — |
| Calculo de coordenadas SVG correcto | Partial | Formula implementada; alineacion no verificada sobre plano real | Verificar que los puntos de los bordes del plano correspondan a `x=0,y=0` y `x=100,y=70.72` |

---

## Diferidos

| Feature | Estado | Nota |
|---|---|---|
| Backend / Supabase | Deferred | Requiere OE especifica |
| Login admin | Deferred | Requiere OE especifica |
| Google Calendar | Deferred | Requiere OE especifica |
| Georreferenciacion real | Deferred | No es objetivo del MVP |

---

## Archivos huerfanos (pendientes de limpieza)

| Archivo | Situacion | Accion pendiente |
|---|---|---|
| `src/components/plan/LotBottomSheet.tsx` | Reemplazado por `LotDetailPanel.tsx`; no importado en ningun lugar | Eliminar en OE de limpieza |
| `src/components/visits/VisitRequestForm.tsx` | Reemplazado por `VisitBookingModal.tsx`; no importado en ningun lugar | Eliminar en OE de limpieza |
| `AISyncPlans.md` | Reemplazado por `AglirPlans.md` | Eliminar o archivar en OE de limpieza |
