# Guidelines Simplificadas - AUTOMATIZACIÓN GITHUB MCP

## 🎯 WORKFLOW OBLIGATORIO CON GITHUB

**SIEMPRE seguir este orden automáticamente:**

### 1. BUSCAR ISSUE PRIMERO

```
ANTES DE HACER NADA → search_issues_github
```

### 2. CREAR ISSUE SI NO EXISTE

```
Si no hay issue → create_issue_github automáticamente
```

### 3. CREAR RAMA NUEVA

```
SIEMPRE crear rama → create_branch_github
Formato: feature/123-descripcion-corta
```

### 4. TRABAJAR EN LA RAMA (NO EN MAIN)

```
NUNCA trabajar en main/master
Usar create_or_update_file_github para trabajar directamente en el repo
```

### 5. AL TERMINAR

```
Cerrar issue → update_issue_github (state: closed)
```

## 🔥 COMANDOS GITHUB MCP PRINCIPALES

### Para Issues:

- `search_issues_github` - Buscar issues existentes
- `create_issue_github` - Crear nuevo issue
- `get_issue_github` - Ver detalles de issue
- `update_issue_github` - Actualizar/cerrar issue
- `add_issue_comment_github` - Comentar en issue

### Para Ramas y Código:

- `create_branch_github` - Crear nueva rama
- `get_file_contents_github` - Leer archivos del repo
- `create_or_update_file_github` - Crear/actualizar archivo EN LA RAMA
- `push_files_github` - Subir múltiples archivos

### Para Pull Requests:

- `create_pull_request_github` - Crear PR
- `get_pull_request_github` - Ver detalles de PR
- `merge_pull_request_github` - Hacer merge
- `request_copilot_review_github` - Pedir review automático

## 🚀 TRIGGERS AUTOMÁTICOS

### CUALQUIER solicitud de desarrollo → Usar GitHub MCP

- Buscar issues relacionados primero
- Crear issue si no existe
- Crear rama automáticamente
- **TRABAJAR DIRECTAMENTE EN LA RAMA** (no localmente)
- Cerrar issue al terminar

### Mencionar librerías → Usar Context7 MCP

- `resolve-library-id_Context_7` + `get-library-docs_Context_7`
- Obtener documentación real

### Tareas complejas (>3 pasos) → Usar Sequential Thinking

- `sequentialthinking_Sequential_thinking` para planificar paso a paso

### UI nueva → Usar Playwright MCP

- Crear tests E2E automáticamente

## 📝 FORMATO DE COMMITS OBLIGATORIO

```bash
# SIEMPRE usar este formato:
"feat(#123): descripción"
"fix(#123): descripción"
"refactor(#123): descripción"
```

## 🎯 WORKFLOW COMPLETO SIMPLIFICADO

```
1. search_issues_github (buscar)
2. create_issue_github (si no existe)
3. create_branch_github (nueva rama)
4. [DESARROLLO CON MCPs - EN LA RAMA]
   - create_or_update_file_github para cada archivo
   - Context7 para docs si es necesario
   - Sequential Thinking si es complejo
   - Playwright para tests E2E
5. create_pull_request_github (crear PR)
6. update_issue_github (cerrar issue)
```

## ⚡ REGLAS SIMPLES

### ✅ HACER SIEMPRE:

- Buscar issues antes de desarrollar
- Crear rama para cada feature/issue
- **TRABAJAR DIRECTAMENTE EN EL REPO** usando GitHub MCP tools
- Usar formato de commits con número de issue
- Consultar documentación real con Context7
- Cerrar issues al terminar

### ❌ NO HACER NUNCA:

- Desarrollar sin issue
- Trabajar en main/master
- Trabajar localmente y luego hacer push
- Commits sin referencia a issue
- Improvisar APIs sin consultar documentación
- Crear archivos locales y luego subirlos

## 🎪 COMANDO RÁPIDO PARA EMPEZAR

**Cada vez que el usuario pida desarrollar algo:**

```
1. search_issues_github
2. Si no existe issue → create_issue_github
3. create_branch_github
4. create_or_update_file_github (para cada archivo)
5. ¡LISTO PARA DESARROLLAR EN EL REPO!
```

**NO PREGUNTAR - EJECUTAR AUTOMÁTICAMENTE**

## 🔧 FLUJO CORRECTO vs INCORRECTO

### ❌ FLUJO INCORRECTO (lo que hicimos antes):

1. Trabajar localmente en main
2. Crear archivos con save-file
3. Hacer push desde local
4. Problemas de sincronización

### ✅ FLUJO CORRECTO (nuevo):

1. search_issues_github
2. create_issue_github
3. create_branch_github
4. create_or_update_file_github (directamente en el repo)
5. create_pull_request_github
6. update_issue_github (cerrar)

## 📋 CHECKLIST ANTES DE CADA DESARROLLO

- [ ] ¿Busqué issues existentes?
- [ ] ¿Creé issue si no existía?
- [ ] ¿Creé rama nueva?
- [ ] ¿Estoy trabajando EN LA RAMA (no en main)?
- [ ] ¿Uso create_or_update_file_github?
- [ ] ¿Formato de commit correcto?
- [ ] ¿Cerré el issue al terminar?

**NUNCA MÁS TRABAJAR LOCALMENTE Y HACER PUSH**
