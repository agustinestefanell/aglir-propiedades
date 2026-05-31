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
