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

### Pendientes al cerrar esta OE

- Trazar los 58 poligonos con `/admin/trace`.
- Auditar manzanas 1, 4, 5, 7.
- Cargar precios reales.
- Limpiar archivos huerfanos.
- Conectar persistencia real.
- Verificar casing de imports en Linux (ver CodingWorkshop.md).
