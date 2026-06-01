# CodingWorkshop.md — Problemas tecnicos resueltos

Proposito: registrar problemas no triviales para evitar repeticion de errores.

Formato obligatorio para futuras entradas:

```
## [Fecha] - [Titulo del problema]
### Problema / Causa raiz / Consecuencia / Proceso / Solucion final / Commit / Leccion
```

---

## 2026-05-30 - Build roto por casing del directorio del proyecto en Windows

### Problema

`npm run build` fallaba con:
- Warning: `There are multiple modules with names that only differ in casing`
- Crash al exportar páginas: `TypeError: Cannot read properties of null (reading 'useContext')`

Todas las rutas (`/`, `/admin`, `/admin/trace`) fallaban en la fase de generación estática.

### Causa raiz

El directorio fue creado por `npx create-next-app aglir-propiedades` (lowercase). NTFS almacena el nombre como `aglir-propiedades`. Pero el proceso se lanzaba desde `C:\proyectos\Aglir-propiedades` (uppercase A).

En Windows, `process.cwd()` retorna lo que el shell escribió (uppercase). Pero `fs.realpathSync.native(process.cwd())` retorna el nombre real almacenado por NTFS (lowercase). Next.js y webpack usan AMBOS mecanismos:

- El SWC loader resuelve su propia ruta via `realpathSync.native` → `aglir-propiedades` (lowercase)
- Los archivos fuente se referencian via `process.cwd()` → `Aglir-propiedades` (uppercase)

Resultado: webpack ve el mismo archivo físico con dos identidades de módulo diferentes. Módulos compartidos (React, en particular) se cargan dos veces. Con dos instancias de React, `useContext` retorna null porque el provider y el consumer están en instancias distintas.

Verificación de la causa:

```bash
node -e "const fs=require('fs'); console.log(fs.realpathSync.native('C:/proyectos/Aglir-propiedades'))"
# Retornó: C:\proyectos\aglir-propiedades  ← confirma el mismatch
```

### Consecuencia

- Build de producción (`npm run build`) roto: todas las páginas fallan en la fase de exportación estática.
- Deploy a Vercel imposible con este error activo.
- `npm run dev` funciona porque el dev server de webpack no hace exportación estática.

### Proceso de solucion

Intento descartado: `next.config.mjs` con `config.resolve.modules = [realNodeModules, "node_modules"]`. No funciona porque el SWC loader construye los identificadores de módulo con su propia ruta (hardcodeada via `realpathSync.native`), independientemente de cómo se configuran los módulos.

Intento de rename: `Rename-Item` falla porque VS Code tiene el directorio en uso.

Solución encontrada: ejecutar el build desde el path canónico de NTFS (lowercase), igualando `process.cwd()` con `realpathSync.native(cwd())`:

```bash
cd C:/proyectos/aglir-propiedades   # ← lowercase, coincide con NTFS
npm run build
# → ✓ Compiled successfully
# → ✓ Generating static pages (6/6)
```

### Solucion final (workaround activo)

**Siempre ejecutar** `npm run dev`, `npm run build` y `git` desde la ruta lowercase:

```
C:\proyectos\aglir-propiedades
```

No desde `C:\proyectos\Aglir-propiedades` (uppercase).

En VS Code: File → Open Folder → escribir `C:\proyectos\aglir-propiedades` (lowercase).

### Solucion permanente (pendiente)

Renombrar el directorio para que NTFS almacene el uppercase definitivamente:

```powershell
# Ejecutar desde C:\proyectos con VS Code cerrado
Rename-Item "Aglir-propiedades" "aglir-propiedades-tmp"
Rename-Item "aglir-propiedades-tmp" "Aglir-propiedades"
# Verificar:
node -e "const fs=require('fs'); console.log(fs.realpathSync.native('C:/proyectos/Aglir-propiedades'))"
# Debe retornar: C:\proyectos\Aglir-propiedades  (uppercase A)
```

Esto requiere:
1. Cerrar VS Code (libera el bloqueo del directorio).
2. Abrir PowerShell en `C:\proyectos`.
3. Ejecutar los dos `Rename-Item` arriba.
4. Abrir VS Code y apuntar a `C:\proyectos\Aglir-propiedades`.

Hasta que se aplique la solución permanente, todos los comandos de desarrollo usan la ruta lowercase.

### Segundo problema relacionado: git e imports

Git en Windows usa `core.ignoreCase = true`. Esto tiene dos efectos adicionales:

1. **Imports con casing incorrecto funcionan localmente pero rompen en Vercel (Linux).**
2. **Renombrar archivos solo por casing no es trackeado correctamente.**

Pendiente:
- [ ] Verificar imports con `tsc --noEmit` en WSL antes de cada push.
- [ ] Eliminar archivos huerfanos (`LotBottomSheet.tsx`, `VisitRequestForm.tsx`) con `git rm`.

### Commit

`a3c9ee3` (build funcionaba desde lowercase; próximo commit documentará este fix).

### Leccion

En Windows: cuando `npx create-next-app <nombre>` crea el directorio, NTFS almacena el casing exacto del argumento. Si luego se accede con diferente casing (ej: `Aglir` vs `aglir`), `process.cwd()` y `fs.realpathSync.native` divergen y webpack carga React dos veces. Regla: siempre usar la misma casing con que se creó el proyecto, o aplicar el rename permanente antes de empezar a desarrollar.

---

## 2026-05-31 - supabaseUrl is required en API routes de Next.js

### Problema

Build de Vercel falla con:
```
Error: supabaseUrl is required
    at new SupabaseClient (...)
```
La ruta `/api/push/subscribe` (y `/api/push/notify`) fallaban en el deploy de producción, aunque funcionaban en desarrollo.

### Causa raiz

El cliente Supabase se importaba como singleton a nivel de módulo:

```typescript
// ❌ INCORRECTO — a nivel de módulo
import { supabase } from "@/lib/supabase";
```

`src/lib/supabase.ts` instancia `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)` también a nivel de módulo. Durante el build de Next.js (fase de exportación estática), los módulos se evalúan con `process.env.*` vacíos — las variables de entorno no están disponibles hasta el runtime. Resultado: `supabaseUrl` es `undefined` y el cliente lanza.

En desarrollo (`npm run dev`) no ocurre porque el servidor se inicia con las env vars ya cargadas y no hay fase de exportación estática.

### Solucion final

Instanciar `createClient` directamente dentro del handler, no a nivel de módulo:

```typescript
// ✅ CORRECTO — dentro del handler
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  // ... resto del handler
}
```

Lo mismo aplica para `webpush.setVapidDetails(...)` en `/api/push/notify/route.ts` — moverlo dentro del handler.

### Archivos afectados

- `src/app/api/push/subscribe/route.ts`
- `src/app/api/push/notify/route.ts`

### Commit

`[ver OE 029]`

### Leccion

En Next.js App Router, cualquier código a nivel de módulo en una API route se evalúa en build time sin acceso a variables de entorno. Todo acceso a `process.env.*` que no sea `NEXT_PUBLIC_*` durante SSR, y toda instanciación de clientes externos (Supabase, Redis, etc.), debe hacerse dentro del handler function. El singleton compartido (`src/lib/supabase.ts`) es seguro para componentes cliente pero no para API routes que se evalúan en build time.

---

## 2026-05-30 - useEffect genérico sobreescribe polígonos cerrados al resetear (trace tool)

### Problema

Al hacer clic en "Limpiar" (ahora "Nuevo") en `/admin/trace`, un polígono cerrado guardado en localStorage era borrado y dejaba de mostrarse en el plano.

### Causa raiz

La arquitectura usaba un `useEffect([selectedId, points, closed])` que llamaba `saveTrace()` ante CUALQUIER cambio de estado, incluyendo el reset. Cuando `handleReset` ejecutaba `setPoints([])` y `setClosed(false)`, el efecto disparaba `saveTrace(id, [], false)`, sobreescribiendo el polígono cerrado con estado vacío. React no ofrece un mecanismo para distinguir "estado cambiado por el usuario" de "estado limpiado intencionalmente" dentro de un efecto genérico.

```
handleReset() → setPoints([]) + setClosed(false)
  → useEffect fires → saveTrace(selectedId, [], false)
  → localStorage[selectedId] = {points: [], closed: false}  ← BUG
  → setAllTraces(prev => {...prev, [id]: {points: [], closed: false}})
  → green background polygon disappears
```

### Consecuencia

Cada vez que el usuario usaba "Limpiar", perdía el trabajo trazado si el polígono ya estaba cerrado. Los polígonos cerrados no sobrevivían al ciclo limpiar→nuevo trazado.

### Solucion final

Separación de ciclos de vida en dos stores independientes:

1. **`aglir_trace_polygons`** (permanente): solo contiene polígonos cerrados (`Record<string, Point[]>`). Se escribe ÚNICAMENTE en `handleClosePolygon`, nunca en reset.

2. **`aglir_trace_draft`** (efímero): contiene el borrador activo en curso (`{id, points}`). Se escribe en el auto-save effect, se borra en `handleNuevo` (renombrado de "Limpiar").

3. Eliminado el `useEffect([selectedId, points, closed])` genérico que causaba el bug.

4. `handleNuevo` (ex "Limpiar") limpia el borrador activo pero nunca toca `aglir_trace_polygons`.

5. Migración transparente del formato antiguo `{points, closed}` → nuevo `Point[]` en `loadClosed()`.

### Commit

`[ver OE 007]`

### Leccion

Nunca usar un `useEffect` genérico de "persistir todo lo que cambia" cuando hay múltiples operaciones (guardar vs resetear) que deben comportarse diferente. El reset intencional siempre debe ser explícito, no como efecto secundario de un cambio de estado. Separar el ciclo de vida de datos permanentes del de datos efímeros desde el diseño.
