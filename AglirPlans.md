# AglirPlans.md — Plano tecnico del proyecto Aglir Propiedades

Reemplaza a `AISyncPlans.md`. Documento tecnico de referencia del proyecto. Se actualiza al cerrar toda OE que modifique arquitectura, estructura, rutas, modelo de datos o patrones.

---

## 1. Identidad del proyecto

- Nombre: Aglir Propiedades
- Proposito: web inmobiliaria mobile-first para venta de terrenos en fraccionamiento 11223, Barros Blancos, Canelones, Uruguay.
- Funcion central: plano interactivo → ficha de terreno → agenda de visita → confirmacion por WhatsApp.
- Canal principal de contacto: WhatsApp (human-in-the-loop, sin envio automatico).
- URL publica Vercel: https://aglir-propiedades.vercel.app
- Git remote: `https://github.com/agustinestefanell/aglir-propiedades.git`

---

## 2. Stack real

| Paquete | Version |
|---|---|
| Next.js | 14.2.35 |
| React | 18.3.1 |
| React DOM | 18.3.1 |
| TypeScript | 5.7.2 |
| Tailwind CSS | 3.4.17 |
| App Router | src/app |

Sin backend. Sin Supabase. Sin Google Calendar. Sin login real.

---

## 3. Estructura de carpetas (estado actual)

```
src/
  app/
    layout.tsx              — layout raiz, metadata
    globals.css             — Tailwind + variables CSS globales
    page.tsx                — pagina publica /
    admin/
      page.tsx              — panel admin /admin
      trace/
        page.tsx            — herramienta de trazado /admin/trace (solo dev)

  components/
    plan/
      InteractivePlan.tsx   — plano con zoom/pan + panel lateral
      LotPolygon.tsx        — poligono SVG por lote
      LotDetailPanel.tsx    — panel lateral de detalle del lote
      LotBottomSheet.tsx    — ARCHIVO HUERFANO (reemplazado por LotDetailPanel)
    visits/
      VisitBookingModal.tsx — modal de registro + agenda (2 pasos)
      VisitRequestForm.tsx  — ARCHIVO HUERFANO (reemplazado por VisitBookingModal)
    admin/
      AdminLotStatusManager.tsx — seccion admin de estados comerciales
      AdminLotStatusCard.tsx    — card por lote con acciones rapidas
      AdminCalendarView.tsx     — vista de solicitudes agrupadas por dia
      AdminVisitList.tsx        — lista de solicitudes con acciones
      WhatsAppAcceptButton.tsx  — acepta visita y abre WA con mensaje

  data/
    lots.ts           — 58 lotes auditados (manzanas 2,3,6,8,9)
    visitRequests.ts  — 4 solicitudes mock para probar admin

  lib/
    whatsapp.ts       — buildWhatsAppUrl + formatContactName

  types/
    index.ts          — tipos compartidos: Lot, VisitRequest, User, etc.

public/
  plan/
    plano-11223.png   — plano catastral real (4682x3311 px, 1.6 MB, PDF convertido)
  logo.jpg            — logo Aglir Propiedades
```

---

## 4. Rutas existentes

### `/` — Pagina publica

- Funcion: seleccionar terrenos disponibles y agendar visitas.
- Cliente: `"use client"`, estado local (selectedLot, bookingLot, requests).
- Componentes usados: `InteractivePlan`, `VisitBookingModal`.
- Flujo: tap en solar disponible → LotDetailPanel → clic "Agendar visita" → VisitBookingModal.
- Sin persistencia: las solicitudes creadas viven solo en estado React de la sesion.

### `/admin` — Panel legacy (no linkado)

- Sigue en el repo pero no está linkado desde ninguna página.
- Reemplazado funcionalmente por `/gestion`.

### `/gestion` — Panel operativo (nuevo)

- URL no predecible para acceso admin.
- Login guard con `sessionStorage["aglir_gestion_user"]`. Credenciales hardcodeadas: Agustin/Estefanell33, Rodrigo/Surferogalactico33.
- Flujo: `LoginScreen` → autenticación → header mínimo "Aglir — Admin" + plano + menú de estado flotante.
- Interacción: double-click/double-tap en lote → `LotStatusMenu` flotante con 3 opciones (En venta / Reservado / Vendido).
- Estado local: cambios de estado viven en `useState` de la página (no persisten entre sesiones).
- Sin cards, sin listas, sin tablas — solo el plano.

### `/admin/trace` — Herramienta de trazado (solo dev)

- Funcion: trazar poligonos SVG sobre el plano para poblar `lots.ts`.
- Guard: si `NODE_ENV !== "development"` muestra mensaje de acceso denegado.
- Click en el plano agrega un vertice; output es array JSON `[{x, y}]` listo para pegar en `lots.ts`.
- Solo accesible en `npm run dev`.

---

## 5. Componentes principales

### `InteractivePlan`

Props: `lots`, `selectedLot`, `onSelectLot`, `onSchedule`, `showLotDetails?`, `isAdmin?`

- Renderiza un único `<svg viewBox="34 10 52 60">` que contiene un `<image>` del plano + los polígonos SVG en el mismo espacio de coordenadas.
- El `viewBox` recorta la vista al área de lotes (x:[34,86], y:[10,70]), ocultando parcialmente el cuadro de superficies del lado izquierdo del documento A3.
- La imagen (`/plan/plano-11223.png`) se coloca en `x="0" y="0" width="100" height="70.72"` — espacio de coordenadas completo; el viewBox hace el clip.
- Si la imagen no carga, muestra un `<rect>` de color de fondo como placeholder.
- Implementa zoom/pan con rueda del mouse, drag y pinch de dos dedos (max 6x).
- Guard `dragMoved` evita que un drag dispare selección de lote.
- Cuando `showLotDetails=false` (admin), no renderiza `LotDetailPanel`.
- Cuando `isAdmin=true`, todos los lotes son clickeables independientemente del estado.
- Muestra leyenda de estados y botón de reset de zoom.
- Sin borde, sin rounded — ocupa ancho completo de su contenedor.
- Contenedor usa `height: "60vh"` (no `minHeight`) para que el SVG se constraja correctamente.
- viewBox `"0 0 100 70.72"` — plan completo, sin recorte. La tabla de coordenadas del A3 queda visible a la izquierda.
- Sin overlays: ni leyenda ni hint flotando sobre el plan. Ambos viven en las páginas que consumen el componente.

### `LotPolygon`

Props: `lot`, `selected`, `onSelect`, `forceClickable?`

- Renderiza un `<polygon>` SVG por lote.
- Solo los `disponible` son clickeables (a menos que `forceClickable=true`).
- Colores: disponible = sin relleno/borde gris, reservado = verde esmeralda, vendido = amarillo.
- Área de hit invisible más ancha (strokeWidth=7) para facilitar el tap en mobile.
- Sin etiqueta de número — el plano original ya tiene los números impresos en la imagen.
- Accesible por teclado (Enter / Space).

### `LotDetailPanel`

Props: `lot`, `onClose`, `onSchedule`

- Badge de estado, Manzana, Solar, m² (muestra "—" si area=0), botón "Agendar visita".
- Mobile: `fixed bottom-0 left-0 right-0 z-30` — bottom sheet fijo, superpuesto sobre el plano.
- Desktop (md+): `sticky top-14 self-start` en columna derecha del grid — sigue visible al hacer scroll.
- Botón "Agendar visita" siempre visible sin scroll (deshabilitado si no disponible).
- Nota "Horario a confirmar · Te contactamos por WhatsApp" fija bajo el botón.

### `VisitBookingModal`

Props: `lot`, `onClose`, `onSubmit`

- Modal en pantalla completa (items-end en mobile, centrado en desktop).
- Paso 1 — Registro: solicita Nombre y WhatsApp. Persiste en `localStorage` bajo clave `aglir_user`. Si ya existe, salta al paso 2.
- Paso 2 — Agenda: solo fecha y hora. El lote viene pre-identificado.
- Paso 3 — Confirmacion: "Solicitud registrada. Horario a confirmar. Te contactamos por WhatsApp."
- El usuario puede cambiar sus datos desde el paso 2.

### `AdminLotStatusManager`

Props: `initialLots`

- Estado local de los 58 lotes (no persiste entre sesiones).
- Busqueda por texto (manzana, solar).
- Plano admin (showLotDetails=false, isAdmin=true) + grilla de cards.
- Sincroniza estado seleccionado entre plano y cards.

### `AdminLotStatusCard`

Props: `lot`, `onChangeStatus`

- Card mobile-first con Manzana, Solar, m² y estado.
- Tres botones: marcar disponible / reservado / vendido.
- Colores: disponible=stone, reservado=emerald, vendido=yellow.

### `AdminVisitList`

Props: `initialRequests`, `lots`

- Lista de solicitudes mock con estado, datos del cliente, terreno, fecha/hora.
- `WhatsAppAcceptButton` por solicitud.
- Estado local: acepta visita → cambia a "aceptada".

### `WhatsAppAcceptButton`

Props: `request`, `lot`, `onAccept`

- Muestra nombre de contacto en formato `AP-[numero][Nombre]`.
- Acepta visita localmente y abre WhatsApp con mensaje preparado.

---

## 6. Modelo de datos

```typescript
type LotStatus = "disponible" | "reservado" | "vendido"

type PolygonPoint = { x: number; y: number }
// x en [0, 100], y en [0, 70.72] — espacio SVG alineado con plano 4682x3311

type Lot = {
  id: string          // "m{manzana}-s{solar}", ej: "m2-s6"
  manzana: string
  solar: string
  area_m2: number
  precio_contado: number     // 0 = pendiente de carga real
  precio_financiado: number  // 0 = pendiente de carga real
  estado: LotStatus
  observaciones: string
  polygon: PolygonPoint[]    // [] = pendiente de trazado
}

type VisitStatus = "pendiente" | "aceptada" | "rechazada" | "realizada"

type VisitRequest = {
  id: string
  nombre: string
  whatsapp: string
  lotId: string
  fecha: string       // "YYYY-MM-DD"
  hora: string        // "HH:MM"
  comentario?: string
  estado: VisitStatus
}

type User = {         // guardado en localStorage["aglir_user"]
  nombre: string
  whatsapp: string
}
```

---

## 7. Dataset de terrenos — `src/data/lots.ts`

90 lotes en dataset:

| Manzana | Solares | Cantidad | Estado de areas |
|---|---|---|---|
| 2 | 1-18 | 18 | s.1-5 placeholder 0; s.6-18 auditados |
| 3 | 1-12 | 12 | s.1-5 placeholder 0; s.6-12 auditados |
| 4 | 6-14, 22-24 | 12 | todos placeholder 0 |
| 6 | 1-19 | 19 | todos auditados (verificar s.14 vs plano) |
| 7 | 1-10 | 10 | todos placeholder 0 |
| 8 | 4-17 | 14 | todos auditados |
| 9 | 1-5 | 5 | todos auditados |
| **Total** | | **90** | |

- Manzana 9 solar 6: excluida (E. LIBRE).
- Manzanas 1 y 5: excluidas, no se conocen sus solares de venta aun.
- `precio_contado` y `precio_financiado`: `0` en todos (placeholder tecnico).
- `polygon`: polígonos cargados desde `polygonMap` (90 trazados). Lotes sin entrada en el mapa reciben `[]`.
- `observaciones`: `"Pendiente de auditoría de área."` si `area_m2 === 0`, `""` en caso contrario.
- Todos los lotes inicializados con `estado: "disponible"`.

---

## 8. Sistema de coordenadas del plano SVG

- Imagen: `public/plan/plano-11223.png` — 4682×3311 px (A3 apaisado, 200 DPI).
- `viewBox` del SVG: `"0 0 100 70.72"` (proporcional: 3311/4682 × 100 = 70.72).
- Esto garantiza que image y SVG tienen identico letterboxing con `preserveAspectRatio="xMidYMid meet"`, alineando poligonos pixel-perfect con el contenido del plano.
- Coordenadas de poligonos: `x ∈ [0, 100]`, `y ∈ [0, 70.72]`.
- Herramienta para obtenerlas: `/admin/trace` (solo en desarrollo).

---

## 9. Flujo de agenda de visitas

```
Usuario toca solar disponible
  → LotDetailPanel aparece (plano sigue visible)
  → Usuario toca "Agendar visita"
    → VisitBookingModal abre
      → ¿localStorage["aglir_user"] existe?
          SI → paso 2 directo
          NO → paso 1: nombre + WA → guarda en localStorage → paso 2
      → Paso 2: solo fecha y hora
      → Submit → onSubmit(data) → paso 3: confirmacion
    → Usuario cierra modal → plano vuelve al foco
```

Sin persistencia backend. Las solicitudes creadas viven en estado React de la sesion en `page.tsx`.

---

## 10. Admin — flujo operativo

```
/admin carga: AdminLotStatusManager (90 lotes) + AdminCalendarView + AdminVisitList

AdminLotStatusManager:
  → Busqueda texto → filtro de cards
  → Plano admin (showLotDetails=false, isAdmin=true) — visual, todos los lotes clickeables
  → Cards: disponible / reservado / vendido → estado LOCAL (no persiste)

AdminVisitList:
  → Lista solicitudes mock (visitRequests.ts)
  → WhatsAppAcceptButton:
      → Muestra nombre de contacto AP-{numero}{nombre}
      → Acepta → abre wa.me/{telefono}?text=mensaje preformateado
```

---

## 11. WhatsApp helper — `src/lib/whatsapp.ts`

`buildWhatsAppUrl({ phone, nombre, terreno, fecha, hora })`
- Limpia telefono dejando solo digitos.
- Construye `https://wa.me/{telefono}?text={mensaje_codificado}`.
- Mensaje: confirmacion de visita con manzana, solar, m², dia y hora.

`formatContactName(nombre, whatsapp)`
- Retorna `AP-{telefono_sin_formato}{nombre}`.
- Ej: `AP-59891234567Camila Rodriguez`.
- Usado en `WhatsAppAcceptButton` para mostrar como guardar el contacto.

**Regla invariante:** el sistema abre WhatsApp con el mensaje preparado, nunca lo envia automaticamente.

---

## 12. Herramienta de trazado — `/admin/trace`

- Carga `plano-11223.png` a pantalla completa con zoom/pan (solo manual — ningun sistema mueve el viewport).
- Click en imagen agrega vertice (punto rojo r≈1.2px con numero al lado).
- Lineas de conexion en rojo mientras abierto; al "Cerrar poligono" cambia a verde esmeralda (fill 0.3 opacity) + label con ID del lote centrado en el centroide.
- Dropdown con los 90 IDs de lotes en orden (no muestra "(0 m²)" en lotes sin auditar).
- Todos los lotes cerrados guardados se muestran como poligonos verdes de fondo al cargar la pagina.
- Persistencia en `localStorage["aglir_trace_polygons"]` — estructura `Record<lotId, {points, closed}>`.
- "Copiar" → clipboard: `[{"x":45.23,"y":32.11},...]`.
- Sistema de coordenadas: igual que `LotPolygon` → `x∈[0,100]`, `y∈[0,70.72]`.
- El array se pega en el campo `polygon` del lote correspondiente en `src/data/lots.ts`.

---

## 13. Colores Tailwind del sistema

| Token | Valor | Uso |
|---|---|---|
| `soil` | `#8f6b4f` | CTA secundario |
| `ink` | `#1f2933` | Texto principal |
| `leaf` | `#2f6f4e` | CTA primario, acentos |
| `paper` | `#f7f5ef` | Fondo general |

---

## 14. Zonas sensibles

- No mezclar con otros proyectos ni cuentas GitHub externas.
- No enviar WhatsApp automaticamente.
- No cargar precios inventados.
- No convertir el plano en georreferenciacion real sin OE especifica.
- No introducir backend sin OE especifica.
- No introducir Google Calendar sin OE especifica.
- No introducir login sin OE especifica.
- No eliminar archivos huerfanos sin OE especifica (pueden tener historial util).

---

## 15. Pendientes tecnicos

- ~~Trazar los 90 polígonos con `/admin/trace` y cargar en `lots.ts`.~~ — Completado OE 008.
- Auditar manzanas 1, 4, 5 y 7.
- Cargar precios reales.
- Eliminar archivos huerfanos: `LotBottomSheet.tsx`, `VisitRequestForm.tsx`.
- Conectar persistencia real (Supabase u otro).
- Implementar login admin.
- Verificar casing de imports en sistema Linux (ver CodingWorkshop.md).
