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
