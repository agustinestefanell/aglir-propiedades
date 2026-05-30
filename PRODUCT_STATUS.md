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
| Dataset lotes — metadata m2/solar/area | Partial | 90 lotes: M2(1-18), M3(1-12), M4(6-14+22-24), M6(1-19), M7(1-10), M8(4-17), M9(1-5) | Auditar areas reales de M2(1-5), M3(1-5), M4, M7; verificar M6 solar 14 |
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
| Plano a pantalla completa con zoom/pan | Closed | Solo movimiento manual; ningun sistema toca `tf` | — |
| Click agrega vertice numerado | Closed | Punto rojo r≈1.2px + label numerico; polyline en abierto | Probar alineacion con plano real |
| Dropdown con 90 IDs de lotes + indicadores | Closed | ✓/· prefix segun estado en localStorage; sin "(0 m²)" en placeholder | — |
| Exportar trazados a lots.ts | Closed | Boton "Exportar todo (N)" genera `polygonMap` listo para pegar; copia al clipboard + panel de previa | — |
| Cerrar poligono con verde + label ID | Closed | fill rgba(52,211,153,0.3) + stroke #059669 + label centrado | — |
| Fondo con todos los cerrados | Closed | `allTraces` state — todos los lotes cerrados del localStorage visibles como verde | — |
| Persistencia en localStorage | Closed | `aglir_trace_polygons` — sobrevive refresh y reinicio; restaura por lote | — |
| Calculo de coordenadas SVG correcto | Partial | Formula implementada; alineacion no verificada sobre plano real | Verificar bordes: x=0,y=0 y x=100,y=70.72 |

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
