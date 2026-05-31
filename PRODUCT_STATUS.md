# PRODUCT_STATUS.md — Estado real de features

Estados: **Closed** (terminado) / **Partial** (funciona con limitaciones) / **UI-only** (sin logica real) / **Deferred** (postergado) / **Broken** (roto/faltante)

Ultima actualizacion: 2026-05-31 — OE 011

---

## Infraestructura

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Next.js 14 + TypeScript + Tailwind + App Router | Closed | `next build` OK, `tsc --noEmit` limpio | Verificar build en Linux antes de cada push |
| Deploy Vercel | Closed | https://aglir-propiedades.vercel.app | Re-deploy con cambios de OE 000 fase 4-5 (sin push aun) |
| GitHub remoto | Broken | Remote configurado pero repo no encontrado en GitHub — 9 commits locales sin push | Crear repo en GitHub y pushear |
| Logo en public/ | Closed | `public/logo.jpg` presente | Integrar en layout.tsx |

---

## Datos

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Dataset lotes — metadata m2/solar/area | Partial | 90 lotes: M2(1-18), M3(1-12), M4(6-14+22-24), M6(1-19), M7(1-10), M8(4-17), M9(1-5) | Auditar areas reales de M2(1-5), M3(1-5), M4, M7; verificar M6 solar 14 |
| Precios reales | Broken | `precio_contado: 0` en todos los lotes | Cargar precios reales cuando se definan |
| Polígonos SVG trazados | Closed | 90 polígonos en `polygonMap` de `lots.ts`; 180 elementos `<polygon>` confirmados en DOM | — |
| Observaciones de lotes | Closed | `area_m2 === 0` → "Pendiente de auditoría de área.", resto → "" | — |
| Solicitudes de visita mock | Partial | 4 registros en `visitRequests.ts` con IDs de lotes validos | Solo para probar admin; no persisten |

---

## Pagina publica `/`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Imagen real del plano | Closed | `public/plan/plano-11223.png` (4682x3311 px) | — |
| Plano con zoom/pan (rueda + drag + pinch) | Closed | `InteractivePlan` con eventos nativos, max 6x | Probar en smartphone real |
| Plano ancho completo (sin márgenes laterales) | Closed | `InteractivePlan` fuera del container max-w-6xl — validado Playwright 390 y 1280px | — |
| Colores de estados en plano | Closed | disponible=sin relleno, reservado=verde, vendido=amarillo | — |
| SVG unificado con imagen (un solo SVG) | Closed | `<svg viewBox="34 10 52 60">` con `<image>` adentro — imagen y polígonos en mismo espacio de coordenadas | — |
| Números SVG sobre lotes | Closed | Eliminados de `LotPolygon.tsx` — el plano original tiene los números impresos | — |
| Polígonos clickeables sobre plano | Closed | 90 polígonos trazados, click abre LotDetailPanel — validado Playwright | — |
| Tabla de coordenadas A3 ocultada | Closed | `<rect fill="white" width="44">` cubre la tabla en SVG; lotes M4 visibles como contornos sobre fondo blanco | — |
| Carátula derecha del A3 | Partial | Sigue visible — requiere editar PNG fuente | Editar PNG fuente |
| Panel lateral — desktop sticky | Closed | `position:sticky top:56px width:300px` — validado Playwright | — |
| Panel — mobile bottom sheet | Closed | `position:fixed bottom:0` — superpuesto sobre plano, validado Playwright | — |
| Botón "Agendar visita" siempre visible | Closed | Bottom sheet fijo — botón en viewport sin scroll | — |
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
| Fondo con todos los cerrados | Closed | `allClosed` state — todos los lotes cerrados visibles como fondo verde siempre | — |
| Persistencia correcta en localStorage | Closed | Dos keys separados: `aglir_trace_polygons` (permanente) + `aglir_trace_draft` (efimero); "Nuevo" nunca borra cerrados | — |
| Boton "Nuevo" (ex "Limpiar") | Closed | Limpia borrador activo; jamas toca poligonos cerrados | — |
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
