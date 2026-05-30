# PromtsOperativos.md — Protocolo operativo vigente

## 1. Proposito

Define como deben operar Claude y cualquier asistente de codigo en el proyecto Aglir Propiedades. Objetivo: mantener continuidad operativa, limitar riesgos y garantizar que el trabajo no dependa de conversaciones anteriores.

## 2. Reglas base

- Toda modificacion relevante se ejecuta mediante una OE numerada.
- Toda OE tiene alcance limitado y archivos autorizados explicitos.
- No abrir refactors laterales fuera del alcance de la OE.
- No inventar datos comerciales (precios, areas, estados de lotes).
- No mezclar este proyecto con otros proyectos o cuentas externas.
- La cuenta GitHub del proyecto es `agustinestefanell` (email: `arenaglirsas@gmail.com`).
- El email git local configurado debe ser `arenaglirsas@gmail.com`.

## 3. Estructura obligatoria de toda OE

```
OE NNN — Titulo
Ejecutor:
Modelo recomendado:
Tipo:
Area:
Ruta local obligatoria:
Objetivo:
Verificacion inicial:
Lectura obligatoria:
Archivos autorizados:
Cambios concretos:
Restricciones:
Validacion:
Actualizacion documental:
Commit:
Reporte final:
```

## 4. Verificacion inicial obligatoria

Toda OE empieza con:

```bash
pwd
git status --short
git branch --show-current
git config user.name
git config user.email
git remote -v
```

Confirmar:
- Ruta: `C:\proyectos\Aglir-propiedades`
- Rama: `main`
- user.name: `Aglir Propiedades`
- user.email: `arenaglirsas@gmail.com`
- Remote origin: `https://github.com/agustinestefanell/aglir-propiedades.git`

Si el email no es `arenaglirsas@gmail.com`, corregir antes de continuar:

```bash
git config user.name "Aglir Propiedades"
git config user.email "arenaglirsas@gmail.com"
```

## 5. Regla documental al cerrar una OE

| Archivo | Cuando actualizarlo |
|---|---|
| `handoff.md` | Siempre — registrar la OE como entrada historica |
| `PRODUCT_STATUS.md` | Si la OE afecta el estado de alguna feature |
| `AglirPlans.md` | Si cambia arquitectura, estructura, rutas, modelo de datos o patrones |
| `CodingWorkshop.md` | Si se resuelve un bug no trivial |
| `PromtsOperativos.md` | Solo si cambia el proceso operativo |
| `DECISIONS.md` | Solo si hay una decision de producto o arquitectura relevante |

Nota: `AISyncPlans.md` es obsoleto. No actualizar. Usar `AglirPlans.md`.

## 6. Frase obligatoria de cierre de toda OE

```
Ejecutar solo este bloque. No abrir refactors laterales.
```

## 7. Reglas de herramienta de trazado

- `/admin/trace` solo se usa en desarrollo local (`npm run dev`).
- Los poligonos generados se pegan en `src/data/lots.ts` bajo el campo `polygon` del lote correspondiente.
- Formato de salida: `[{"x": 45.23, "y": 32.11}, ...]` donde `x∈[0,100]`, `y∈[0,70.72]`.
- No publicar coordenadas de poligonos en el repo hasta auditarlas visualmente.

## 8. Reglas de WhatsApp

- El sistema solo prepara y abre mensajes. Nunca los envia automaticamente.
- Formato de contacto para guardar en agenda del admin: `AP-{telefono_sin_formato}{Nombre}`.
- Ejemplo: `AP-59891234567Camila Rodriguez`.
