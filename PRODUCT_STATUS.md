# PRODUCT_STATUS.md — Estado real de features

Estados: **Closed** (terminado) / **Partial** (funciona con limitaciones) / **UI-only** (sin logica real) / **Deferred** (postergado) / **Broken** (roto/faltante)

Ultima actualizacion: 2026-10-06 — OE 041b

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
| Dataset lotes — metadata m2/solar/area | Closed | 90 lotes auditados completos (OE 030): M2, M3, M4, M7 completadas; M8 s10/s11 y M9 corregidas | Verificar M6 s.14 vs plano |
| Precios reales | Partial | Editables desde tab "Terrenos" en `/gestion` → `lot_states.precio_ur` / `precio_contado` (OE 037) | Ejecutar SQL de columnas (OE 037) + policies (OE 036); cargar precios reales |
| Polígonos SVG trazados | Closed | 90 polígonos cargados en OE 020 — coordenadas portrait `y∈[0,155.20]`, trazados por el usuario en `/admin/trace` | Verificar alineación visual en smartphone real |
| Observaciones de lotes | Closed | `area_m2 === 0` → "Pendiente de auditoría de área.", resto → "" | — |
| Solicitudes de visita mock | Partial | 4 registros en `visitRequests.ts` con IDs de lotes validos | Solo para probar admin; no persisten |

---

## Pagina publica `/`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Imagen real del plano | Closed | `public/plan/plano-11223.png` (2897×4496 px, portrait, OE 016) | — |
| Plano con zoom/pan (rueda + drag + pinch) | Closed | `InteractivePlan` con eventos nativos, max 8x | Probar en smartphone real |
| Contenedor smartphone 430px centrado | Closed | `InteractivePlan` wrapeado en `max-w-[430px] mx-auto`; fondo bg-paper en desktop fuera del contenedor | — |
| Colores de estados en plano | Closed | disponible=sin relleno, reservado=verde, vendido=amarillo | — |
| SVG unificado con imagen (un solo SVG) | Closed | `<svg viewBox="0 0 100 155.20">` con `<image>` adentro — imagen portrait completa, sin crop | — |
| Números SVG sobre lotes | Closed | Eliminados de `LotPolygon.tsx` — el plano original tiene los números impresos | — |
| Polígonos clickeables sobre plano | Closed | 90 polígonos trazados, click abre LotDetailPanel — validado Playwright | — |
| Tabla de coordenadas A3 visible | Closed | Visible en viewBox izquierdo (x:[0,34]); no se suprime — el plano la muestra intencionalmente | — |
| Carátula derecha del A3 | Closed | Nueva imagen portrait sin carátula lateral separada — todo el contenido está integrado en la imagen | — |
| Panel lateral — desktop sticky | Closed | `position:sticky top:56px width:300px` — validado Playwright | — |
| Panel — mobile bottom sheet | Closed | `position:fixed bottom:0` — superpuesto sobre plano, validado Playwright | — |
| Botón "Descargar propuesta" | Closed | `LotDetailPanel`, solo lotes disponibles → `/propuesta/[id]?modo=publico` (OE 039b) | — |
| Botón "Agendar visita" | Deferred | Eliminado de `LotDetailPanel` en OE 039 | `VisitBookingModal` sigue en el repo, inalcanzable |
| Flujo de agenda (registro + booking) | Deferred | Sin punto de entrada desde OE 039. Antes: | `VisitBookingModal` 2 pasos; guarda en Supabase `visit_requests`; error visible si falla | — |
| Persistencia de solicitudes de visita | Closed | Supabase `visit_requests` — persiste entre sesiones (OE 023) | — |
| Precio en panel de detalle | Partial | `LotDetailPanel` muestra "Precio: UR …" / "Contado: U$S …" si hay precios cargados; nada si no (OE 037) | Depende de SQL de columnas y de RLS SELECT |
| Lotes no disponibles bloqueados | Closed | `LotDetailPanel` muestra "Este terreno no está disponible." + botón deshabilitado para reservado/vendido | — |

---

## Panel admin `/admin`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Ruta `/admin` legacy | Closed | Vaciada en OE 017 — devuelve página en blanco; funcionalidad admin real en `/gestion` | — |
| Gestion de estados comerciales (local) | Partial | `AdminLotStatusManager` + `AdminLotStatusCard` — cambios locales por sesion | Persistencia real en backend |
| Busqueda de lotes por manzana/solar | Closed | Filtro de texto en `AdminLotStatusManager` | — |
| Panel de visitas admin | Closed | Tab "Visitas" en `/gestion` — lista Supabase `visit_requests` con realtime, badge pendientes, botones WhatsApp + Confirmar (OE 031) | — |
| WhatsApp human-in-the-loop | Partial | `buildWhatsAppUrl` + apertura de `wa.me/...` | Probar con numero real |
| Formato de contacto AP-{tel}{Nombre} | Closed | `formatContactName` en `whatsapp.ts`, visible en `WhatsAppAcceptButton` | Probar flujo real |
| Login admin (`/gestion`) | Closed | `LoginScreen` con credenciales hardcodeadas, **localStorage** (persiste entre sesiones) (OE 025) | Migrar a Supabase Auth |
| Cambio de estado desde plano (admin) | Closed | Single-tap → `LotStatusMenu`; upsert en Supabase `lot_states`; optimistic update inmediato (OE 023) | — |
| Sincronización Admin ↔ Público | Broken | `useLotStates` con Supabase realtime (`postgres_changes`) implementado correctamente (OE 023) pero al abrir/recargar la página no se leen los estados guardados — sospecha de RLS de SELECT bloqueando lectura anon en `lot_states` (OE 036) | Ejecutar SQL de policies en Supabase (OE 036) y confirmar en navegador |
| URL admin no predecible | Closed | `/gestion` en lugar de `/admin`; botón Admin eliminado del header público | — |
| Tabla de precios (tab Terrenos) | Partial | `AdminPriceTable` — 90 lotes, inputs UR / Contado U$S, Guardar por fila con upsert en `lot_states` (OE 037) | Ejecutar SQL `add column precio_ur/precio_contado` en Supabase |
| Edición de precio desde popup del plano | Partial | `LotStatusMenu` con inputs Precio UR / U$S contado + "Guardar precio", pre-llenados, comparte `useLotStates` con tab Terrenos (OE 037b) | Ejecutar SQL de columnas (OE 037) |
| Botón "Enviar propuesta" en popup del plano | Closed | `LotStatusMenu`, solo lotes disponibles → `/propuesta/[id]?modo=vendedor`; pide perfil si no existe (OE 039/039b) | — |
| Perfil del vendedor | Closed | `VendedorProfileModal` — nombre, teléfono, "Logo de tu inmobiliaria" (JPG/PNG, redimensionado 400px) en `localStorage["aglir_vendedor"]` (OE 039); logo se pide al ingresar a `/gestion` si falta ("Omitir por ahora" disponible) y se edita con "Editar mi perfil" en el header (OE 041/041b) | Solo vive en el dispositivo del vendedor; probar upload en smartphone |
| Tab Vendedores (gestión) | Partial | `AdminVendedores` — tabla con estado, count de propuestas, Aprobar/Desactivar, realtime (OE 040) | Ejecutar SQL OE 040 (RLS + realtime publication) |
| Logo Aglir en header | Closed | `public/logo.jpg` integrado en ambas páginas (`img` h-8 w-8) | — |

---

## Propuesta comercial `/propuesta/[id]`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Página de propuesta | Partial | Logos, Mz/Solar, m², precio UR, plano con lote en amarillo, condiciones, footer vendedor + fecha + validez 15 días; renderiza en `next dev` (OE 039) | Precio depende de SQL OE 037 + RLS OE 036 |
| Versión pública vs vendedor | Closed | `?modo=publico` (default) sin datos de vendedor; `?modo=vendedor` con logo, nombre, teléfono y "Editar mi perfil" (OE 039b) | — |
| Descargar JPG (html2canvas) | Partial | `propuesta-m{mz}-s{solar}.jpg`, scale 2, JPEG 0.92 (OE 039) | Probar descarga en smartphone real (iOS Safari) |

---

## Portal de vendedores `/vendedores`

| Feature | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Registro de vendedor | Partial | Nombre/Teléfono/Mail/PIN → insert `vendedores` estado pendiente; PIN único (OE 040) | Esquema asumido sin verificar — ejecutar SQL OE 040 |
| Login por PIN | Partial | PIN + estado activo → sesión `aglir_vendedor_session` (OE 040) | Riesgo: PIN 4 dígitos sin rate limit, tabla legible con anon key |
| Dashboard vendedor (plano + Generar propuesta) | Partial | Plano solo lectura, bottom sheet, insert en `propuestas` → `/propuesta/[id]?modo=vendedor` (OE 040) | Probar contra Supabase real |
| Push al admin por registro | Partial | `/api/push/notify` "Nuevo vendedor registrado" (OE 040) | Probar en dispositivo admin |

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
| Calculo de coordenadas SVG correcto | Partial | `SVG_H` corregido a `155.20` en OE 018 — SVG overlay y imagen portrait ahora alinean | Verificar bordes: x=0,y=0 y x=100,y=155.20 al retrazar |

---

## Diferidos

| Feature | Estado | Nota |
|---|---|---|
| Backend / Supabase | Closed | `@supabase/supabase-js@2.106.2` instalado; `src/lib/supabase.ts` con env vars; tablas `lot_states` + `visit_requests` integradas (OE 023) |
| Login admin | Deferred | Requiere OE especifica |
| PWA instalable | Closed | `manifest.json`, `sw.js`, `ServiceWorkerRegister` — instalable en Android/iOS desde Chrome (OE 024) |
| Notificaciones push | Closed | Web Push API + VAPID + Supabase `push_subscriptions` — botón "🔔 Notif" en header admin para activar manualmente (OE 024/025) |
| Google Calendar | Deferred | Requiere OE especifica |
| Georreferenciacion real | Deferred | No es objetivo del MVP |

---

## Archivos huerfanos (pendientes de limpieza)

| Archivo | Situacion | Accion pendiente |
|---|---|---|
| `src/components/plan/LotBottomSheet.tsx` | Reemplazado por `LotDetailPanel.tsx`; no importado en ningun lugar | Eliminar en OE de limpieza |
| `src/components/visits/VisitRequestForm.tsx` | Reemplazado por `VisitBookingModal.tsx`; no importado en ningun lugar | Eliminar en OE de limpieza |
| `AISyncPlans.md` | Reemplazado por `AglirPlans.md` | Eliminar o archivar en OE de limpieza |
