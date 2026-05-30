# CodingWorkshop.md — Problemas tecnicos resueltos

Proposito: registrar problemas no triviales para evitar repeticion de errores.

Formato obligatorio para futuras entradas:

```
## [Fecha] - [Titulo del problema]
### Problema / Causa raiz / Consecuencia / Proceso / Solucion final / Commit / Leccion
```

---

## 2026-05-30 - Casing de archivos en Windows vs Linux (Vercel)

### Problema

Git en Windows usa `core.ignoreCase = true` por defecto. Esto tiene dos efectos concretos en este proyecto:

1. **Imports con casing incorrecto funcionan localmente pero rompen en Vercel (Linux).**
   Ejemplo: `import { InteractivePlan } from "@/components/plan/interactiveplan"` compila en Windows, falla en produccion.

2. **Renombrar un archivo solo cambiando el casing no es trackeado por git en Windows.**
   Ejemplo: hacer `git mv LotBottomSheet.tsx lotbottomsheet.tsx` en Windows no genera un cambio de nombre real en el historial; en Linux el archivo viejo sigue siendo accesible con el casing original.

### Causa raiz

`git config core.ignoreCase` vale `true` en instalaciones de Git para Windows. El filesystem NTFS es case-insensitive, por lo que ni el SO ni git detectan la discrepancia de casing. En el servidor de Vercel (Linux con filesystem ext4, case-sensitive), la misma discrepancia rompe la resolucion de modulos.

### Consecuencia

- Un import mal escrito que pasa TypeScript y el linter local puede hacer fallar el build en Vercel.
- Un archivo renombrado solo por casing puede existir con dos nombres aparentemente distintos en el historial de git.
- **Estado actual:** no hay imports con casing incorrecto conocido, pero no se ha verificado en un sistema Linux. El riesgo es latente.

### Proceso de deteccion

Observado al revisar el proyecto en la sesion de trabajo del 2026-05-30: la transicion del componente `LotBottomSheet.tsx` al nuevo `LotDetailPanel.tsx` se hizo creando el archivo nuevo y actualizando imports, sin usar `git mv`. El archivo viejo quedo huerfano. En un escenario de rename-only, esta tecnica hubiera ocultado el problema.

### Solucion pendiente

- [ ] Ejecutar `npx tsc --noEmit` en un sistema Linux o WSL antes de cada push importante.
- [ ] Configurar git localmente con `git config core.ignoreCase false` para detectar problemas de casing en Windows (requiere precaucion: puede generar falsos conflictos).
- [ ] Alternativa recomendada: agregar un job de CI en GitHub Actions que haga `tsc --noEmit` en Ubuntu. Cuando se active Vercel CI esto se cubre automaticamente.
- [ ] Eliminar archivos huerfanos (`LotBottomSheet.tsx`, `VisitRequestForm.tsx`) en una OE de limpieza para reducir confusion.

### Commit relacionado

No hay commit especifico; el riesgo fue identificado durante revision de codigo en esta sesion.

### Leccion

Siempre usar `git mv` para renombrar archivos, incluso cuando el cambio no es solo de casing. En Windows, verificar imports criticos con `tsc --noEmit` en WSL o ejecutar el build real antes de push a main.
