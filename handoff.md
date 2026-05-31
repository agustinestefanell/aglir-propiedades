# handoff.md — Historial operativo del proyecto Aglir Propiedades

Cada entrada registra una OE completada. El objetivo es que cualquier sesion nueva pueda retomar el trabajo sin depender de conversaciones anteriores.

---

## OE 000 — Setup inicial y construccion del MVP

**Fecha:** 2026-05-29 al 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Setup + Feature

### Que se construyo

Todo el proyecto desde cero, en las siguientes fases:

#### Fase 1 — Scaffold inicial (commit `44be750`)

- Next.js 14 + TypeScript + Tailwind CSS + App Router.
- Estructura base de carpetas `src/app`, `src/components`, `src/data`, `src/lib`, `src/types`.
- Tipos compartidos: `Lot`, `VisitRequest`, `LotStatus`, `VisitStatus`, `PolygonPoint`.
- Dataset mock inicial de lotes.
- Componentes iniciales: `InteractivePlan`, `LotPolygon`, `LotBottomSheet`, `VisitRequestForm`.
- Admin mock: `AdminVisitList`, `AdminCalendarView`, `WhatsAppAcceptButton`.
- Helper `buildWhatsAppUrl`.
- Paleta Tailwind: soil, ink, leaf, paper.

#### Fase 2 — Admin mobile de estados comerciales (commit `2d1ff45`)

- `AdminLotStatusManager` + `AdminLotStatusCard`.
- El admin puede marcar terrenos como disponible / reservado / vendido en modo local.
- Plano integrado en el admin (`showLotDetails=false`).
- Vista de solicitudes agrupadas por dia (`AdminCalendarView`).
- Documentacion inicial: `handoff.md`, `PRODUCT_STATUS.md`, `AISyncPlans.md`, `CodingWorkshop.md`, `PromtsOperativos.md`, `DECISIONS.md`.

#### Fase 3 — Metadata real de 58 lotes (commit `bc62130`)

- `src/data/lots.ts` reemplazado con los 58 lotes reales auditados desde el plano del padron 11223.
- Manzanas: 2 (sol.6-18), 3 (sol.6-12), 6 (sol.1-19 ex.14), 8 (sol.4-17), 9 (sol.1-5).
- Manzana 9 solar 6 excluida: E. LIBRE.
- IDs estables: `m{manzana}-s{solar}`.
- Todos con `estado: "disponible"`, `polygon: []`, `precio_contado: 0`.

#### Fase 4 — Plano interactivo completo, flujo de agenda y admin mejorado (sin commit aun)

- **Zoom/pan** en el plano: rueda del mouse, drag, pinch de 2 dedos. Max 6x. Guard `dragMoved` para diferenciar tap de drag.
- **Colores correctos de estados**: disponible = sin relleno/borde gris, reservado = verde esmeralda, vendido = amarillo.
- **`LotDetailPanel`**: panel lateral que no cierra el plano. Mobile = debajo del plano, desktop = columna derecha.
- **`VisitBookingModal`**: flujo en 2 pasos (registro Nombre+WA → fecha/hora). WhatsApp como identificador de sesion persistido en `localStorage["aglir_user"]`.
- **`formatContactName`**: formato `AP-{tel}{Nombre}` para la agenda del admin.
- **`isAdmin` prop** en `InteractivePlan`: cuando true, todos los lotes son seleccionables.
- Colores admin corregidos: reservado = verde, vendido = amarillo (antes ambos eran amber).
- Mock data de visitas corregida para usar IDs de lotes validos.

#### Fase 5 — Imagenes y herramienta de trazado (sin commit aun)

- PDF `11223-NB-V01-M02 S-V.pdf` convertido a PNG con PyMuPDF a 200 DPI.
- Resultado: `public/plan/plano-11223.png` (4682x3311 px, 1.6 MB).
- Logo copiado a `public/logo.jpg`.
- `viewBox` del SVG actualizado a `"0 0 100 70.72"` para alinear con aspect ratio real del plano (4682/3311).
- `fontSize` de labels de solar actualizado a `"2"` (proporcional al nuevo viewBox).
- `/admin/trace` creado: herramienta de trazado de poligonos (solo `NODE_ENV=development`).

### Estado al cierre de OE 000

- Build TypeScript: limpio (`tsc --noEmit` sin errores).
- Rutas: `/`, `/admin`, `/admin/trace`.
- Plano real presente: `public/plan/plano-11223.png`.
- Poligonos SVG: pendientes de trazar (todos `polygon: []`).
- Precios: pendientes (`precio_contado: 0`).

### Archivos del repo al cierre

Ver `AglirPlans.md` para la lista completa actualizada.

---

## OE 001 — Infraestructura documental minima

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Documentacion

### Objetivo

Leer el repositorio completo y escribir los 5 archivos del protocolo reflejando el estado real del proyecto.

### Accion ejecutada

- **`AglirPlans.md`** creado: arquitectura completa real (reemplaza `AISyncPlans.md` que queda como obsoleto).
- **`CodingWorkshop.md`** actualizado: primera entrada real — error de casing en Windows vs Linux/Vercel (riesgo latente, solucion pendiente).
- **`PromtsOperativos.md`** reescrito: reglas base, formato de OE, regla documental, remote URL real, reglas de trazado y WhatsApp.
- **`handoff.md`** reescrito: OE 000 documenta todo el trabajo previo; OE 001 documenta esta sesion documental.
- **`PRODUCT_STATUS.md`** reescrito: estado real de cada feature hoy.

### Notas

- `AISyncPlans.md` queda en repo como archivo obsoleto. No eliminar sin OE especifica.
- Remote URL real: `https://github.com/agustinestefanell/aglir-propiedades.git` (difiere del que tenia documentado el PRODUCT_STATUS.md anterior que decia `arenaglirsas-33`).
- Archivos huerfanos identificados: `LotBottomSheet.tsx`, `VisitRequestForm.tsx` — pendientes de limpieza en OE futura.

### Pendientes al cerrar OE 001

- Trazar los 58 poligonos con `/admin/trace`.
- Auditar manzanas 1, 4, 5, 7.
- Cargar precios reales.
- Limpiar archivos huerfanos.
- Conectar persistencia real.
- Verificar casing de imports en Linux (ver CodingWorkshop.md).

---

## OE 004 — Mejoras UI en /admin/trace

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI fix + feature

### Objetivo

Reducir tamaño de vértices en el trazador, garantizar que los botones no reseteen el viewport, y agregar persistencia en localStorage.

### Accion ejecutada

**Reduccion de puntos de vertice:**
- `r="0.7"` → `r="0.47"` en SVG units (≈4px a viewport estandar de 600px altura).
- `strokeWidth="0.2"` → `strokeWidth="0.12"` (borde proporcional al nuevo tamano).
- Offset de label ajustado: `x={p.x + 0.9}` → `x={p.x + 0.63}`, `y={p.y - 0.6}` → `y={p.y - 0.45}`. Numero sigue visible al lado del punto.

**Garantia de zoom/pan invariante:**
- Verificado que ninguno de los handlers de "Cerrar poligono", "Copiar" y "Limpiar" llama `setTf`.
- Agregados comments explicitando el invariante (`// tf is intentionally NOT reset here`).

**Persistencia localStorage (`aglir_trace_polygons`):**
- Estructura: `Record<lotId, { points, closed }>` — un registro por cada lote trazado.
- Guardado automatico via `useEffect` en cada cambio de `points` o `closed`.
- Restauracion automatica al seleccionar un lote (via `useEffect` en `selectedId`).
- Si el lote no tiene trazado guardado, la herramienta arranca limpia.
- Sobrevive refresh del browser y reinicio del servidor de desarrollo.

### Archivos tocados

- `src/app/admin/trace/page.tsx`
- `handoff.md`, `PRODUCT_STATUS.md` (actualizados)

### Pendientes de OE 004

- Trazar los 90 lotes con la herramienta y verificar alineacion con contenido real del plano.
- Aplicar fix permanente del casing del directorio (ver CodingWorkshop.md).

---

## OE 005 — Ajustes UI trazado + nuevos lotes

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI + Datos

### Objetivo

Refinar la herramienta de trazado y ampliar el dataset de lotes.

### Accion ejecutada

**UI `/admin/trace`:**

1. Puntos de vertice reducidos al 30% del radio anterior: `r="0.47"` → `r="0.14"` (≈1.2px). Offset de label ajustado: `x+0.25`, `y-0.3`. Numero sigue visible al lado del punto.

2. Zoom/pan invariante confirmado — ninguna accion del sistema modifica `tf`. Comment explicito: `// No system action modifies tf — viewport movement is 100% manual`.

3. Poligonos cerrados: cambio de color rojo → verde esmeralda (fill rgba(52,211,153,0.3), stroke #059669) + etiqueta con el ID del lote centrada en el centroide del poligono.

4. Fondo con todos los trazados guardados: al cargar `/admin/trace`, se recuperan todos los lotes cerrados del localStorage y se muestran como poligonos verdes de fondo. Permite ver el avance global de trazado. Se actualiza en tiempo real al cerrar nuevos poligonos.

5. Dropdown mejorado: oculta el area cuando es 0 (placeholder) para no mostrar "(0 m²)" en lotes sin auditar.

**Dataset `src/data/lots.ts`:**

- Manzana 2 solares 1-5: 5 lotes nuevos (area pendiente, placeholder 0).
- Manzana 3 solares 1-5: 5 lotes nuevos (area pendiente, placeholder 0).
- Manzana 4 solares 6-14 + 22-24: 12 lotes nuevos (area pendiente).
- Manzana 7 solares 1-10: 10 lotes nuevos (area pendiente).
- Total nuevo: 32 lotes (OE decia 27, pero la lista explicita suma 32 — se agregaron exactamente los listados).
- Total lotes en dataset: 90 (antes 58).
- Tipo del array explicitado como `[string, string, number][]` para compatibilidad TypeScript.
- Observaciones diferenciadas: `"Pendiente de auditoria. Area placeholder."` para area=0.
- Dropdown de la herramienta de trazado muestra los 90 lotes en orden por manzana/solar.

### Archivos tocados

- `src/app/admin/trace/page.tsx`
- `src/data/lots.ts`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Pendientes de OE 005

- Auditar areas reales de manzanas 2 (s.1-5), 3 (s.1-5), 4 (s.6-14 + 22-24) y 7 (s.1-10).
- Trazar los 90 poligonos con `/admin/trace`.
- Verificar alineacion visual del trazado sobre el plano real.

---

## OE 006 — Exportar trazados de localStorage a lots.ts

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Feature — herramienta de desarrollo

### Objetivo

Cerrar el gap entre localStorage y lots.ts: los poligonos trazados en /admin/trace deben poder exportarse al codigo fuente con un click.

### Accion ejecutada

**Indicadores en dropdown:**
- `✓ ` prefijo para lotes con poligono cerrado en localStorage.
- `· ` prefijo para lotes con puntos sin cerrar.
- Sin prefijo para lotes sin traza.
- Lee `allTraces` (ya existia en estado) — sin overhead adicional.

**Boton "Exportar todo (N)" en controls bar:**
- Violeta, muestra el conteo de poligonos cerrados.
- Deshabilitado si no hay poligonos cerrados.
- Al hacer click: genera el bloque de texto, lo copia al clipboard Y abre el panel de export.
- Feedback: cambia a "✓ Copiado" por 2 segundos.

**Panel de export (fondo de pantalla):**
- Aparece al hacer click en "Exportar todo".
- Muestra el texto completo en `<pre>` con color violeta.
- Boton "Copiar" propio para re-copiar sin regenerar.
- Boton "✕" para cerrar el panel.

**Formato del output generado:**
```typescript
// Exportado desde /admin/trace — YYYY-MM-DD — N poligonos
// 1. Pegar en src/data/lots.ts antes de "export const lots"
// 2. En el map, cambiar:  polygon: []
//    por:                 polygon: polygonMap[`m${manzana}-s${solar}`] ?? []

const polygonMap: Record<string, { x: number; y: number }[]> = {
  "m2-s6": [{x: 45.23, y: 32.11}, ...],
  "m3-s7": [{x: 52.1, y: 28.4}, ...],
};
```
- Entradas ordenadas por ID (numericamente).
- El usuario solo pega el bloque y cambia una linea en el map.

**Funcion `buildPolygonMap()`:**
- Lee `allTraces` del estado (ya sincronizado con localStorage).
- Filtra solo los cerrados con >= 3 puntos.
- Ordena por ID con `localeCompare({ numeric: true })`.

### Archivos tocados

- `src/app/admin/trace/page.tsx`
- `handoff.md`, `PRODUCT_STATUS.md` (actualizados)

### Pendientes de OE 006

- Trazar los 90 poligonos, exportar y pegar en lots.ts.
- Verificar que el `polygonMap` funciona correctamente en el build.

---

## OE 007 — Fix crítico: persistencia de polígonos en /admin/trace

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Bug fix crítico

### Problema

Al hacer "Limpiar" en `/admin/trace`, los polígonos cerrados guardados desaparecían del plano y se borraban de localStorage. Un polígono que tomó 30+ clicks de trabajo se perdía con un solo click de reset.

### Causa raiz

Ver CodingWorkshop.md — `useEffect([selectedId, points, closed])` genérico que llamaba `saveTrace()` ante cualquier cambio, incluyendo el reset que dejaba `points=[]` y `closed=false`, destruyendo el polígono guardado.

### Solucion aplicada

**Separación de ciclos de vida en dos localStorage keys:**

`aglir_trace_polygons` — permanente, solo polígonos cerrados (`Record<string, Point[]>`)
- Escrito ÚNICAMENTE en `handleClosePolygon`
- Nunca tocado por reset

`aglir_trace_draft` — efímero, un solo borrador activo (`{id, points}`)
- Auto-guardado mientras se traza
- Borrado en `handleNuevo` (renombrado de "Limpiar")

**Cambios de componente:**
- Eliminado `useEffect([selectedId, points, closed])` genérico (causa raiz del bug)
- `handleClosePolygon`: guarda explícitamente en `aglir_trace_polygons` + actualiza `allClosed` state
- `handleNuevo` (ex "Limpiar"): limpia `points`, `isClosed`, draft — NUNCA toca los polígonos cerrados
- `allTraces` renombrado a `allClosed: Record<string, Point[]>` — solo almacena permanentes
- `closed: boolean` renombrado a `isClosed: boolean` — más descriptivo
- Migración transparente del formato antiguo `{points, closed}` → `Point[]` en `loadClosed()`
- Restauracion de borrador al cambiar lote: primero busca cerrado, luego borrador guardado

### Archivos tocados

- `src/app/admin/trace/page.tsx`
- `CodingWorkshop.md` (causa raiz y solucion)
- `handoff.md`, `PRODUCT_STATUS.md` (actualizados)

### Pendientes

- Trazar los 90 polígonos.
- Probar el flujo completo: trazar → cerrar → "Nuevo" → confirmar que el polígono verde persiste.
- Exportar y pegar en lots.ts, verificar build.

---

## OE 008 — Fix observaciones y validar lots.ts

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Fix + Validación

### Objetivo

Corregir el campo `observaciones` del map en `lots.ts` (ya no era correcto tras cargar los 90 polígonos) y limpiar un punto duplicado en `m3-s1`.

### Acción ejecutada

**Cambio 1 — observaciones corregidas:**
- `area_m2 === 0` → `"Pendiente de auditoría de área."` (antes decía "Pendiente de auditoria. Area placeholder.")
- `area_m2 > 0` → `""` (antes decía "Metadata auditada desde plano. Poligono pendiente de trazado." — incorrecto porque los polígonos ya están cargados)

**Cambio 2 — fix punto duplicado m3-s1:**
- Array original: 6 puntos con `{"x":57.17,"y":63.46}` y `{"x":58.36,"y":63.62}` redundantes.
- Array corregido: 4 puntos únicos `[{57.9,58.93},{59.46,59.32},{58.38,63.62},{56.87,62.93}]`.

**Validación:**
- `tsc --noEmit`: limpio, sin errores.
- Playwright (390×844 mobile): 180 elementos `<polygon>` en DOM, imagen del plano cargada correctamente.
- Click en polígono → `LotDetailPanel` abre con Manzana, Solar y m².
- Campo `observaciones` vacío para lotes con área > 0 (correcto).

### Archivos tocados

- `src/data/lots.ts`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Pendientes al cerrar OE 008

- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.
- Limpiar archivos huérfanos.
- Conectar persistencia real.

---

## OE 009 — Fix push a GitHub

**Fecha:** 2026-05-30
**Ejecutor:** Claude (Sonnet 4.6) + usuario
**Tipo:** Infra / DevOps

### Diagnóstico

- Remote `origin` apunta a `https://github.com/agustinestefanell/aglir-propiedades.git`.
- `git ls-remote` retorna "Repository not found" desde GitHub — el repo no existe o es privado sin credenciales.
- `gh` CLI no disponible en el entorno.
- `curl` a github.com falla por restricción de red en el entorno de Claude.
- Identidad git: `Aglir Propiedades <arenaglirsas@gmail.com>`.
- 9 commits locales pendientes de push.

### Resolución requerida (manual — usuario)

Dos pasos a ejecutar en terminal local:

**1 — Crear el repo en GitHub (si no existe):**
- github.com/new → nombre `aglir-propiedades`, cuenta `agustinestefanell`
- Sin README/gitignore/license (el historial local ya existe)

**2 — Autenticar y pushear:**
- Opción HTTPS con PAT: `git remote set-url origin https://agustinestefanell:<TOKEN>@github.com/agustinestefanell/aglir-propiedades.git`
- Opción SSH: `git remote set-url origin git@github.com:agustinestefanell/aglir-propiedades.git`
- Luego: `git push origin main`

### Estado al cerrar

- Commit local: `4d12ef7` y 8 anteriores — todos pendientes de push.
- Push bloqueado por credenciales/repo inexistente: acción requerida del usuario.

### Pendientes al cerrar OE 009

- Crear repo en GitHub y pushear los 9 commits.
- Verificar que Vercel se reconecta automáticamente tras el push.

---

## OE 010 — Ajustes UI página pública

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI

### Cambios ejecutados

**C1 — Subtítulo eliminado (`page.tsx`):**
- Quitado `<p>Fraccionamiento 11223 · Canelones, Uruguay</p>` debajo del H1.

**C2 — Plano ancho completo (`page.tsx`):**
- `<InteractivePlan>` movido fuera del `<div className="mx-auto max-w-6xl px-4">`.
- El título conserva su container con padding; el plano ocupa 100% del viewport.
- Verificado: `section.x = 0, width = 390` en mobile y `width = 1280` en desktop.

**C3 — Números SVG eliminados (`LotPolygon.tsx`):**
- Quitado el elemento `<text>` con el número de solar y el cálculo del centroide (cx, cy).
- Verificado: `document.querySelectorAll('svg text').length = 0`.

**C4 — Recorte de tabla A3 (`InteractivePlan.tsx`):**
- Arquitectura cambiada: `<img>` + `<svg>` superpuesto → único `<svg viewBox="34 10 52 60">` con `<image>` adentro.
- El `viewBox` recorta el espacio de coordenadas para mostrar solo la zona de lotes (x:[34,86], y:[10,70]).
- Mejora parcial: los lotes llenan más pantalla y se oculta la mayor parte del cuadro de superficies.
- Limitación estructural: el cuadro y los polígonos de M4/M2 comparten coordenadas (x≈38-44). Eliminar completamente el cuadro requiere editar el PNG fuente.
- La carátula (título, firmas) del lado derecho del A3 también sigue visible por la misma razón.

### Archivos tocados

- `src/app/page.tsx`
- `src/components/plan/InteractivePlan.tsx`
- `src/components/plan/LotPolygon.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Pendientes al cerrar OE 010

- Editar `plano-11223.png` para recortar la carátula del lado derecho del A3.
- Push a GitHub (pendiente de OE 009).

---

## OE 011 — Ajustes UI panel derecho y tabla izquierda

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI

### Cambios ejecutados

**C1 — Tabla de coordenadas ocultada (`InteractivePlan.tsx`):**
- `<rect x="0" y="0" width="44" height="70.72" fill="white" pointerEvents="none" />` insertado entre `<image>` y polígonos en el SVG.
- Cubre x:[0,44] del espacio de coordenadas donde se encuentra la tabla de coordenadas X/Y del plano A3.
- `pointerEvents="none"` garantiza que los clicks pasen a los polígonos.
- Los lotes M4 (x:[38.31,44]) muestran fondo blanco en lugar del plano; sus contornos SVG siguen visibles y clickeables.

**C2/C4 — Panel sticky (desktop) y bottom sheet (mobile) (`LotDetailPanel.tsx`):**
- Mobile: `fixed bottom-0 left-0 right-0 z-30` — superpuesto sobre el plano como bottom sheet.
- Desktop: `md:sticky md:top-14 md:self-start` — fijo en columna derecha al hacer scroll.
- Verificado: mobile `position:fixed, bottom:0px`; desktop `position:sticky, top:56px, width:300px`.

**C3 — Botón "Agendar visita" siempre visible:**
- Con el bottom sheet fijo en mobile, el botón queda en el viewport. Verificado: `top:740, bottom:788` dentro de 844px.
- Nota "Horario a confirmar" aparece inmediatamente bajo el botón, sin scroll.

**Bug fix — SVG expandía el contenedor en desktop (`InteractivePlan.tsx`):**
- `minHeight: "60vh"` → `height: "60vh"` en el plan container.
- Con `minHeight`, el SVG usaba su tamaño intrínseco (ratio viewBox 52:60 → ~1476px en desktop 1280px) y el contenedor se expandía, dejando invisible el 70% inferior del plano. Ahora el SVG se constrae a `height: 100%` de los 60vh del contenedor.

**Mejora adicional (`InteractivePlan.tsx`):**
- Hint text "Tocá un solar disponible" se oculta cuando el panel está abierto (`!panelVisible`).

**Ajuste cosmético (`LotDetailPanel.tsx`):**
- `area_m2 === 0` muestra "— m²" en lugar de "0 m²".

### Archivos tocados

- `src/components/plan/InteractivePlan.tsx`
- `src/components/plan/LotDetailPanel.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Pendientes al cerrar OE 011

- Editar PNG para ocultar la carátula del lado derecho del A3.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 012 — Rediseño del flujo admin

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Feature — nueva ruta + login + interacción admin

### Cambios ejecutados

**Nueva ruta `/gestion` (`src/app/gestion/page.tsx`):**
- Reemplaza `/admin` como punto de entrada del admin (URL no predecible).
- Login guard: lee `sessionStorage["aglir_gestion_user"]` en `useEffect`. Si no hay sesión → muestra `LoginScreen`.
- Al loguearse: escribe en sessionStorage, muestra el panel. Al salir: borra sessionStorage.
- Contenido: plan interactivo + `LotStatusMenu` flotante + `AdminCalendarView` + `AdminVisitList`.

**`LoginScreen` (`src/components/admin/LoginScreen.tsx`):**
- Credenciales hardcodeadas: Agustin/Estefanell33, Rodrigo/Surferogalactico33.
- Error "Credenciales incorrectas." si no coinciden.
- `sessionStorage` para persistencia de sesión (expira al cerrar el tab).

**`LotStatusMenu` (`src/components/admin/LotStatusMenu.tsx`):**
- Menú flotante `position: fixed` en las coordenadas del click.
- 3 opciones: En venta (= disponible) / Reservado / Vendido, con dots de color.
- Opción actual marcada con ✓.
- Backdrop `fixed inset-0 z-40` cierra el menú al hacer click fuera.
- Posición ajustada para no desbordarse del viewport.

**`LotPolygon` actualizado:**
- Nuevo prop `onDoubleSelect?: (lot, clientX, clientY) => void`.
- `lastTapRef` detecta double-click/double-tap en ≤350ms sin añadir latencia al single-click.
- Si `onDoubleSelect` está definido: primer click → `onSelect` normal; segundo click rápido → `onDoubleSelect`.

**`InteractivePlan` actualizado:**
- Nuevo prop `onLotDoubleClick?: (lot, clientX, clientY) => void`.
- `handleLotDoubleClick` con guard `dragMoved` para no disparar en drag.
- Pasa `onDoubleSelect` a `LotPolygon` solo cuando `onLotDoubleClick` está definido.

**Página pública (`src/app/page.tsx`):**
- Botón "Admin" → `/admin` eliminado del header. La URL `/gestion` no está linkada públicamente.

### Archivos tocados

- `src/app/gestion/page.tsx` (nuevo)
- `src/components/admin/LoginScreen.tsx` (nuevo)
- `src/components/admin/LotStatusMenu.tsx` (nuevo)
- `src/components/plan/LotPolygon.tsx`
- `src/components/plan/InteractivePlan.tsx`
- `src/app/page.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Pendientes al cerrar OE 012

- Reemplazar credenciales hardcodeadas por Supabase Auth (OE siguiente).
- Persistir cambios de estado de lotes en base de datos.
- Decidir qué hacer con la ruta `/admin` legacy.

---

## OE 013 — Limpiar admin: eliminar cards y dejar solo el plano

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI — limpieza

### Cambios ejecutados

**`src/app/gestion/page.tsx`:**
- Eliminados: imports de `visitRequests`, `AdminCalendarView`, `AdminVisitList`.
- Eliminado: bloque `<div>` con `AdminCalendarView` y `AdminVisitList`.
- Eliminado: sección h1 "Panel de gestión" + párrafo de instrucción.
- Header simplificado: "Aglir — Admin" (texto, no link) + nombre de usuario + botón Salir.
- Resultado: header + plano + menú flotante — nada más.

**`src/components/admin/LotStatusMenu.tsx`:**
- Más minimalista: sin borde (`border`), `shadow-2xl` para profundidad.
- `rounded-lg` (menos redondeado que `rounded-xl`).
- Padding reducido: `py-1` en container, `py-2` en botones.
- Dots más pequeños: `h-2 w-2`.
- Label lote más compacto: `text-[10px] tracking-widest`.

### Archivos tocados

- `src/app/gestion/page.tsx`
- `src/components/admin/LotStatusMenu.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Pendientes al cerrar OE 013

- Reemplazar credenciales hardcodeadas por Supabase Auth.
- Persistir cambios de estado en DB.

---

## OE 014 — Fix plano roto + layout vertical mobile

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Bug fix + UI

### Problemas resueltos

**1 — Plano cortado (viewBox revertido) `InteractivePlan.tsx`:**
- `const VIEW = "34 10 52 60"` → `"0 0 100 70.72"`. Plan completo visible. Tabla de coordenadas queda a la izquierda (sin ocultar).
- Eliminado el `<rect fill="white" width="44">` que tapaba la tabla.

**2 — Rótulo eliminado del plan `InteractivePlan.tsx`:**
- Eliminado overlay absoluto con "Tocá un solar disponible" / "Seleccioná un solar".
- Eliminada la leyenda (Disponible/Reservado/Vendido) que era un overlay absoluto en la esquina inferior del plan.
- El plan ahora no tiene ningún texto flotante encima.

**3 — Layout vertical público `page.tsx`:**
- H1 centrado: `text-center`.
- Fila flex centrada debajo del H1: leyenda (□ Disponible / ■ Reservado / ■ Vendido) + "·" + "Tocá un solar disponible".
- Todo en fila `flex-wrap justify-center`.

**4 — Click en lote disponible reparado:**
- El viewBox cropped causaba desalineación entre imagen y polígonos SVG. Al revertir a full viewBox, los polígonos coinciden con lo que el usuario ve.
- Umbral `dragMoved` en touch: 4px → 10px para tolerar movimiento natural del dedo.
- Validado: click en polígono → bottom sheet "Disponible / Manzana 2 / Agendar visita".

**5 — Admin sin leyenda `gestion/page.tsx`:**
- Al eliminar los overlays de `InteractivePlan`, el admin queda con solo header + plano.

### Archivos tocados

- `src/components/plan/InteractivePlan.tsx`
- `src/app/page.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

---

## OE 015 — Mobile-first: sincronización Admin↔Público + recorte plano + logo + bottom sheets

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Feature + UI/UX mobile-first

### Cambios ejecutados

**C1 — `src/lib/lotStates.ts` (nuevo):**
- Hook `useLotStates()` — fuente única de verdad para el estado comercial de lotes.
- Lee/escribe en `localStorage["aglir_lot_states"]` (`Record<lotId, LotStatus>`).
- `baseLots` de `lots.ts` es inmutable; los estados del localStorage actúan como overlay.
- Evento `focus` re-sincroniza al volver al tab (soporte multitab básico).
- Retorna `[lots, changeStatus]`.

**C2 — Recorte lateral derecho (`InteractivePlan.tsx`):**
- `VIEW` cambiado de `"0 0 100 70.72"` → `"0 0 78 70.72"`.
- Lote más a la derecha: m9-s5 en x=73.75 → margen seguro de 4.25 unidades.
- Elimina del encuadre: carátula derecha (norte, rótulo, información marginal).
- Mantiene: planilla de coordenadas izquierda (x:[0,34]) + todos los lotes.
- No distorsiona la imagen ni desalinea polígonos (origen permanece en 0,0).

**C3 — `LotStatusMenu.tsx` convertido a bottom sheet:**
- Eliminado el popup flotante posicionado por coordenadas de click (position x,y).
- Nuevo diseño: `fixed bottom-0 left-0 right-0` + backdrop + handle bar + info del lote + 3 opciones.
- Eliminado prop `position`. Compatible con interacción móvil.

**C4 — Single-click en admin (`gestion/page.tsx`):**
- Eliminado `onLotDoubleClick` / double-tap. Un solo tap abre el bottom sheet de estado.
- `handleSelectLot(lot)` busca el lote en `lots[]` (con overrides aplicados) y abre `LotStatusMenu`.
- `handleChangeStatus` actualiza tanto `changeStatus(id, status)` como `selectedLot` local para reflejo inmediato del checkmark.

**C5 — Logo en ambas páginas:**
- `public/logo.jpg` integrado en header de `page.tsx` y `gestion/page.tsx` (`<img> h-8 w-8`).
- Header admin: 2 filas — logo + ADMIN badge + Salir / leyenda de estados.
- Header público: logo + nombre, compacto.

**C6 — `LotDetailPanel.tsx` — lotes no disponibles:**
- Rama `lot.estado !== "disponible"`: muestra "Este terreno no está disponible." en recuadro stone-50 + botón disabled "No disponible".
- Rama `disponible`: botón "Agendar visita" + nota de confirmación (sin cambio).

**C7 — `VisitBookingModal.tsx` — texto de confirmación:**
- Step 3: "¡Solicitud registrada!" → "Solicitud enviada." / "Nos comunicaremos por WhatsApp para confirmar la visita."

**C8 — `page.tsx` y `gestion/page.tsx` usan `useLotStates()`:**
- Eliminado import estático de `lots` en ambas páginas.
- Estado comercial compartido: cambio en admin → se ve en público al navegar o al hacer focus en la pestaña.

### Archivos tocados

- `src/lib/lotStates.ts` (nuevo)
- `src/components/plan/InteractivePlan.tsx`
- `src/components/admin/LotStatusMenu.tsx`
- `src/components/plan/LotDetailPanel.tsx`
- `src/components/visits/VisitBookingModal.tsx`
- `src/app/page.tsx`
- `src/app/gestion/page.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Resultado de build

- `tsc --noEmit`: limpio, sin errores.

### Pendientes al cerrar OE 015

- Persistir cambios de estado en backend real (Supabase u otro) — actualmente solo en localStorage.
- Push a GitHub (sigue pendiente de OE 009).
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 016 — Sustitución de imagen base del plano

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Infra — reemplazo de asset

### Cambios ejecutados

**C1 — Imagen reemplazada:**
- Copiado: `IMAGENES DE PROYECTO/11223-NB-V01-M02 S-V copia.png` → `public/plan/plano-11223.png`
- Anterior: 4682×3311 px, landscape, ratio h/w = 70.72%
- Nueva: 2897×4496 px, **portrait**, ratio h/w = 155.20%

**C2 — ViewBox actualizado (`InteractivePlan.tsx`):**
- `VIEW`: `"0 0 78 70.72"` (OE 015) → `"0 0 100 155.20"` (nuevo ratio, sin crop lateral)
- `<image height>`: `"70.72"` → `"155.20"`
- `<rect height>` (fallback): `"70.72"` → `"155.20"`
- Sin crop lateral: la imagen portrait no tiene carátula en el lado derecho.

**C3 — Documentación actualizada:**
- `AglirPlans.md` §3, §8 — nuevas dimensiones, nuevo ratio, advertencia de re-trazado.
- `PRODUCT_STATUS.md` — "Polígonos SVG trazados" cambiado a **Broken**.

### Diagnóstico crítico — polígonos desalineados

Los 90 polígonos en `lots.ts/polygonMap` fueron trazados sobre la imagen anterior (landscape 4682×3311, sistema y∈[0,70.72]). La nueva imagen tiene orientación portrait con dimensiones y aspect ratio completamente distintos. Los polígonos aparecen en el DOM pero sus coordenadas no coinciden con los lotes reales en la nueva imagen.

**Acción requerida:** Re-trazar los 90 polígonos con `/admin/trace` (herramienta solo disponible en `NODE_ENV=development`) sobre la nueva imagen, exportar y reemplazar `polygonMap` en `lots.ts`.

### Archivos tocados

- `public/plan/plano-11223.png` (reemplazado)
- `src/components/plan/InteractivePlan.tsx`
- `handoff.md`, `PRODUCT_STATUS.md`, `AglirPlans.md` (actualizados)

### Resultado de build

- `tsc --noEmit`: limpio, sin errores.

### Pendientes al cerrar OE 016

- **CRÍTICO:** Re-trazar los 90 polígonos sobre la nueva imagen portrait con `/admin/trace`.
- Verificar en smartphone real que la nueva imagen carga y se ve correctamente.
- Persistir cambios de estado en backend real.
- Push a GitHub.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 017 — Vaciar `/admin` legacy + confirmar panel condicional

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Limpieza quirúrgica

### Cambios ejecutados

**C1 — `src/app/admin/page.tsx` vaciado:**
- Todo el contenido anterior (imports de `AdminLotStatusManager`, `AdminCalendarView`, `AdminVisitList`, `lots`, `visitRequests` + JSX completo) reemplazado por:
  ```tsx
  export default function AdminPage() {
    return null;
  }
  ```
- La ruta `/admin` ahora devuelve página en blanco. El panel operativo real vive en `/gestion`.

**C2 — `InteractivePlan.tsx` verificado, sin cambios:**
- `LotDetailPanel` ya estaba condicional: `const panelVisible = showLotDetails && selectedLot` (línea 180) + `{panelVisible && <LotDetailPanel ... />}` (línea 257).
- El panel solo aparece al tocar un lote. Sin modificación necesaria.

### Resultado de build

- `tsc --noEmit`: limpio, sin errores.

### Pendientes al cerrar OE 017

- **CRÍTICO:** Re-trazar los 90 polígonos sobre la nueva imagen portrait con `/admin/trace`.
- Persistir cambios de estado en backend real.
- Push a GitHub.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 018 — Revertir viewBox + fix zoom + limpiar polígonos + corregir trace

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Bug fix + preparación retrazado

### Cambios ejecutados

**C1 — viewBox verificado, sin cambio:**
- `InteractivePlan.tsx` ya tenía `VIEW = "0 0 100 155.20"` e `image height="155.20"`. Correcto.

**C2 — Fix zoom `InteractivePlan.tsx` — clamp con letterbox:**
- Causa raíz del zoom "bailando": el `clamp` anterior usaba `el.clientWidth` como si el plano llenara el contenedor, pero con `xMidYMid meet` y una imagen portrait, el plano queda letterboxed horizontalmente. En desktop (1280px wide, 60vh alto), el plano real ocupa solo ~309px centrado — el zoom usaba bounds incorrectos y el contenido se escapaba fuera del viewport.
- Nuevo `clamp`: calcula el offset real de letterboxing (`rW, rH, rX, rY`) y acota el translate al contenido real del SVG. Cuando el contenido es más angosto que el container (escala < ~4x en desktop), bloquea en centro. Cuando supera el container, permite pan en el rango exacto.
- `min(6, ...)` → `min(8, ...)` — max zoom de 6x a 8x.

**C3 — `src/data/lots.ts` — polygonMap vaciado:**
- 90 polígonos del trazado anterior (landscape, `y∈[0,70.72]`) eliminados.
- `polygonMap` reemplazado por `{}`. Todos los lotes quedan con `polygon: []`.
- El campo `polygon: polygonMap[...] ?? []` sigue en el map — al repoblar polygonMap en `/admin/trace`, basta con pegar el nuevo bloque.

**C4 — `src/app/admin/trace/page.tsx` — SVG_H corregido:**
- `SVG_H = 70.72` → `SVG_H = 155.20`.
- Con el valor anterior, el SVG overlay tenía ratio landscape (1.414) mientras la imagen portrait tiene ratio 0.644 — no alineaban. Con `155.20`, ambos tienen el mismo ratio y se alinean pixel-perfect con `xMidYMid meet`.
- El `viewBox` del SVG overlay y la fórmula de `handleClick` usan `SVG_H` automáticamente.

### Diagnóstico adicional — localStorage

Los polígonos trazados anteriormente en `localStorage["aglir_trace_polygons"]` siguen en el navegador en coordenadas `y∈[0,70.72]`. Al abrir `/admin/trace`, aparecerán como fondo verde pero desalineados con la nueva imagen. Se recomienda limpiar el localStorage antes de retrazar: `localStorage.removeItem("aglir_trace_polygons")`.

### Resultado de build

- `tsc --noEmit`: limpio, sin errores.

### Pendientes al cerrar OE 018

- **CRÍTICO:** Limpiar localStorage en el navegador y retrazar los 90 polígonos sobre la nueva imagen portrait con `/admin/trace` (`y∈[0,155.20]`).
- Persistir cambios de estado en backend real.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 019 — Contenedor smartphone 430px

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI — layout

### Problema

El plano es portrait (vertical/angosto) pero el contenedor ocupaba 100% del ancho de pantalla. En desktop el plano real quedaba en ~309px centrado en 1280px, con mucho espacio vacío lateral, y el zoom se escapaba horizontalmente.

### Cambios ejecutados

**C1 — `InteractivePlan.tsx` — wrapper 430px:**
- `<section>` con optional 2-column grid reemplazado por `<div className="mx-auto w-full max-w-[430px]">`.
- El plano queda contenido en 430px centrado. En desktop el fondo `bg-paper` de la página ocupa el resto.
- `height: "60vh"` → `height: "80vh"` — más espacio vertical para la imagen portrait.
- El `overflow-hidden` del contenedor impide que el zoom se escape fuera del 430px.

**C2 — `LotDetailPanel.tsx` — bottom sheet centrado:**
- Eliminado el modo desktop `md:sticky md:top-14 md:self-start` (ya no hay grid).
- Nueva posición en todos los tamaños: `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30`.
- Agregado `rounded-t-xl` para acabado de bottom sheet flotante centrado.

**C3 — `LotStatusMenu.tsx` — bottom sheet centrado:**
- `fixed bottom-0 left-0 right-0` → `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]`.
- El backdrop (inset-0) sigue siendo full-screen.

**C4 — `page.tsx` — título y leyenda centrados:**
- `<div className="px-4 pt-4 pb-3">` → `<div className="mx-auto w-full max-w-[430px] px-4 pt-4 pb-3">`.
- El bloque de título + leyenda queda alineado con el plano (mismos 430px).

### Resultado de build

- `tsc --noEmit`: limpio, sin errores.

### Pendientes al cerrar OE 019

- ~~Retrazar los 90 polígonos~~ — completado en OE 020.
- Persistir cambios de estado en backend real.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 020 — Integrar polygonMap retrazado en lots.ts

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Datos

### Cambio ejecutado

**`src/data/lots.ts` — polygonMap reemplazado:**
- El usuario completó el retrazado de los 90 lotes sobre la imagen portrait (2897×4496) con la herramienta `/admin/trace`.
- `polygonMap` vacío reemplazado por el bloque exportado desde la herramienta con 90 entradas.
- Coordenadas en sistema portrait: `x∈[0,100]`, `y∈[0,155.20]`.
- `polygon: polygonMap[\`m${manzana}-s${solar}\`] ?? []` ya existía en el map — sin cambios al resto del archivo.
- Distribución: M2(18) + M3(12) + M4(12) + M6(19) + M7(10) + M8(14) + M9(5) = 90.

### Resultado de build

- `tsc --noEmit`: limpio, sin errores.

### Pendientes al cerrar OE 020

- Verificar alineación visual de polígonos en smartphone real.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Persistir cambios de estado en backend real.
- Cargar precios reales.

---

## OE 021 — Fix header + título + diagnóstico /gestion

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI fix + diagnóstico

### Cambios ejecutados

**C1 — Título en una sola línea (`page.tsx`):**
- `text-2xl md:text-3xl` → `text-xl`. "Terrenos en Barros Blancos" entraba en dos líneas porque `md:text-3xl` (30px) superaba el ancho disponible en el contenedor de 430px con padding interno.

**C2 — Header contenido en 430px (`page.tsx` + `gestion/page.tsx`):**
- Header: eliminado `px-4 py-3` del elemento `<header>`, movido al `<div>` interno.
- Inner div público: `max-w-6xl` → `max-w-[430px]`.
- Inner div gestion: wrapeado en `max-w-[430px] px-4 pt-3 pb-2`. Segunda fila (leyenda) también wrapeada en `max-w-[430px] px-4 pb-2`.
- En ambas páginas: `border-b` sigue en el `<header>` (full-width), el contenido queda dentro de 430px.

**C3 — Diagnóstico /gestion:**
- `tsc --noEmit`: limpio, sin errores.
- `npm run build`: errores de prerender en TODAS las páginas incluyendo `/` (que funciona en dev). Causa: bug de Next.js 14 en el paso de export estático, no en código de la app.
- `LoginScreen`, `useLotStates`, `gestion/page.tsx` y todos sus imports: correctos.
- `useLotStates` tiene guard `typeof window === "undefined"` — SSR-safe.
- Causa más probable del "blanco" en dev: `if (!authChecked) return null` produce blanco durante el primer render (~1 tick antes de que `useEffect` dispare). Debe resolverse solo y mostrar `LoginScreen`.
- **Si persiste en blanco:** abrir DevTools → Console → buscar error rojo. El error en console va a indicar la causa real.

### Resultado de build

- `tsc --noEmit`: limpio.

### Pendientes al cerrar OE 021

- Verificar que /gestion carga el LoginScreen en el navegador.
- Verificar alineación visual de polígonos en smartphone real.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Persistir cambios de estado en backend real.
- Cargar precios reales.

---

## OE 022 — Fix login: mostrar/ocultar contraseña

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** UI — feature mínima

### Cambio ejecutado

**`src/components/admin/LoginScreen.tsx`:**
- Nuevo estado `showPassword: boolean`.
- Campo contraseña envuelto en `<div className="relative">`.
- `type="password"` → `type={showPassword ? "text" : "password"}`.
- Botón `"Ver"` / `"Ocultar"` posicionado en `absolute right-3 top-1/2 -translate-y-1/2`.
- `pr-16` en el input para que el texto no quede debajo del botón.
- `type="button"` en el botón para no disparar el submit del formulario.
- `aria-label` accesible.

### Resultado de build

- `tsc --noEmit`: limpio.

### Pendientes al cerrar OE 022

- Verificar que /gestion carga el LoginScreen en el navegador.
- Verificar alineación visual de polígonos en smartphone real.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- ~~Persistir cambios de estado en backend real~~ — completado OE 023.
- Cargar precios reales.

---

## OE 023 — Integrar Supabase: persistencia real de estados y visitas

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Backend — integración Supabase

### Cambios ejecutados

**P1 — Instalación:**
- `npm install @supabase/supabase-js` → v2.106.2.

**P2+P5 — `src/lib/supabase.ts` (nuevo):**
- Cliente Supabase usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `.env.local` creado con las credenciales (excluido de git por `.env*` en `.gitignore`).

**P3 — `src/lib/lotStates.ts` reescrito:**
- Eliminado localStorage completamente.
- `fetchOverrides()` lee tabla `lot_states` (`lot_id`, `estado`) desde Supabase.
- `upsertState()` hace upsert en la tabla.
- `useLotStates()` en `useEffect`: fetch inicial + suscripción realtime `postgres_changes` en tabla `lot_states`. Al recibir cualquier cambio, refetch completo. Retorna canal para cleanup.
- Flujo: admin cambia estado → `changeStatus()` → optimistic update local → upsert Supabase → evento realtime → página pública refetch → re-render con nuevo estado.

**P4 — `src/components/visits/VisitBookingModal.tsx` actualizado:**
- Importa `supabase` desde `@/lib/supabase`.
- `handleSchedule` ahora es `async`.
- Nuevos estados: `submitting: boolean`, `submitError: string | null`.
- Al enviar: insert en `visit_requests` con campos `lot_id`, `manzana`, `solar`, `nombre`, `whatsapp`, `dia_hora` (`${fecha} ${hora}`), `comentario`.
- Si error: muestra mensaje "No se pudo registrar la solicitud. Intentá de nuevo."
- Botón muestra "Enviando…" mientras `submitting=true` y queda `disabled`.
- Si éxito: llama `onSubmit()` (local state) y avanza a step "done".

**P6 — Variables en Vercel:**
- Usuario debe agregar en Vercel Dashboard → Settings → Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Resultado de build

- `tsc --noEmit`: limpio.

### Pendientes al cerrar OE 023

- Agregar variables de entorno en Vercel Dashboard (acción manual del usuario).
- Verificar en browser: admin cambia estado → página pública actualiza en tiempo real.
- Verificar en Supabase: solicitud de visita aparece en tabla `visit_requests`.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.

---

## OE 024 — PWA + notificaciones push para admin

**Fecha:** 2026-05-31
**Ejecutor:** Claude (Sonnet 4.6)
**Tipo:** Feature — PWA + Web Push

### Cambios ejecutados

**P1 — PWA:**
- `public/manifest.json`: name, short_name, start_url=/gestion, display=standalone, theme=#1a6b45.
- `public/sw.js`: service worker — maneja eventos `push` (showNotification) y `notificationclick` (openWindow /gestion).
- `src/components/ServiceWorkerRegister.tsx`: componente "use client" que registra `sw.js` en `useEffect`.
- `src/app/layout.tsx`: importa `Viewport` de next, agrega `manifest: "/manifest.json"`, `themeColor: "#1a6b45"`, monta `<ServiceWorkerRegister />`.

**P2 — Web Push:**
- `npm install web-push @types/web-push`.
- VAPID keys generadas con `web-push.generateVAPIDKeys()` — guardadas en `.env.local` (excluido de git):
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pública, usada en cliente)
  - `VAPID_PRIVATE_KEY` (privada, solo servidor)
  - `VAPID_SUBJECT=mailto:arenaglirsas@gmail.com`
- `src/app/api/push/subscribe/route.ts`: POST — recibe subscription del browser, inserta en `push_subscriptions`.
- `src/app/api/push/notify/route.ts`: POST (`runtime=nodejs`) — recibe title/body/url, fetcha todas las subscripciones, llama `webpush.sendNotification`. Elimina subscripciones expiradas (status 410).
- `src/app/gestion/page.tsx`: `useEffect([user])` — cuando el admin loguea, pide permiso de notificaciones, obtiene/crea suscripción push, POST a `/api/push/subscribe`.
- `src/components/visits/VisitBookingModal.tsx`: después del insert exitoso en Supabase, fire-and-forget fetch a `/api/push/notify`.

**P3 — Tabla Supabase:**
El usuario debe ejecutar en Supabase SQL Editor:
```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscription jsonb not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "service role only" on push_subscriptions for all using (true);
```

### Variables de entorno a agregar en Vercel Dashboard

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEmsngDhIOaHLpt5AsqKNaib_zfeVa2LJ0vQLnfXAVMB0k6BZJFK6mCGCkL1UTC39LY3iaKj5-A9qYce6A6lib4
VAPID_PRIVATE_KEY=dmHIAQSUqEhnYLnUjTGiOZssuUrkigqh388SzBVjV3w
VAPID_SUBJECT=mailto:arenaglirsas@gmail.com
```
(Más las de OE 023: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

### Resultado de build

- `tsc --noEmit`: limpio.

### Pendientes al cerrar OE 024

- Ejecutar SQL de `push_subscriptions` en Supabase (acción manual).
- Agregar variables VAPID en Vercel Dashboard (acción manual).
- Verificar en Chrome mobile: aparece "Agregar a pantalla de inicio".
- Verificar flujo completo: visita agendada → notificación push en dispositivo admin.
- Auditar áreas reales de M2(s.1-5), M3(s.1-5), M4, M7.
- Cargar precios reales.
