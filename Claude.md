# Observatorio simple de licencias de proveedores de IA

## Objetivo

Construir una aplicación simple para cargar, parsear, persistir y visualizar licencias, EULA, términos de servicio, políticas de privacidad u otros documentos equivalentes de proveedores de IA.

La aplicación no necesita base de datos, colas, workers ni arquitectura distribuida. El flujo esperado es manual o semiautomático: se ingresa una licencia, se procesa una sola vez, se genera un JSON normalizado en disco y luego la interfaz muestra ese resultado en una vista comparativa.

El foco del sistema es jurídico-documental: identificar y exponer, con trazabilidad textual, cómo cada proveedor regula privacidad, propiedad intelectual, uso de outputs, entrenamiento con datos del usuario, deber de seguridad, limitaciones de responsabilidad, indemnidades, jurisdicción, cambios de términos y diferencias entre planes gratuitos y pagos.

## Principios de diseño

La aplicación debe ser deliberadamente simple. No debe introducir infraestructura innecesaria. El JSON en disco es la fuente de verdad. Cada documento parseado debe producir un archivo estable, legible y versionable por Git.

El sistema no debe fabricar conclusiones legales. Cada conclusión debe estar asociada a evidencia textual extraída del documento original. Si una cláusula no aparece o no puede determinarse, debe indicarse como `not_found`, `unclear` o `requires_review`.

El resultado debe poder verse de dos maneras dentro de una misma vista: una variante en lenguaje claro para usuarios no abogados y otra variante técnica para abogados.

## Alcance funcional del MVP

El MVP debe permitir:

1. Cargar o indicar un documento fuente.
2. Parsear la licencia una sola vez.
3. Extraer información jurídica relevante.
4. Guardar el resultado como JSON en disco.
5. Mostrar el JSON en una vista web.
6. Alternar entre lenguaje claro y lenguaje jurídico.
7. Mostrar la evidencia textual que respalda cada conclusión.
8. Comparar proveedores y planes en una matriz simple.

No se requiere autenticación, multiusuario, PostgreSQL, Prisma, colas, cron jobs ni scraping automatizado en esta primera versión.

## Arquitectura propuesta

La aplicación puede implementarse como un proyecto TypeScript simple con tres partes:

```text
ai-license-observatory/
  package.json
  README.md
  data/
    sources/
      openai-chatgpt-free.txt
      anthropic-claude-pro.txt
    parsed/
      openai-chatgpt-free.json
      anthropic-claude-pro.json
  src/
    parser/
      parseLicense.ts
      schema.ts
      prompts.ts
    app/
      page.tsx
      components/
        ProviderMatrix.tsx
        LicenseDetail.tsx
        EvidencePanel.tsx
        LanguageToggle.tsx
    lib/
      loadParsedLicenses.ts
      types.ts
  scripts/
    parse-one.ts
```

La forma más simple sería usar Next.js con archivos JSON locales. También puede usarse Vite + React si se prefiere una aplicación estática. Para este caso, Next.js es conveniente porque permite leer archivos del directorio `data/parsed` desde el servidor sin montar una API compleja.

## Flujo de procesamiento

El flujo principal debe ser:

```text
Documento fuente
      |
      v
scripts/parse-one.ts
      |
      v
src/parser/parseLicense.ts
      |
      v
JSON normalizado en data/parsed
      |
      v
Vista web
```

El parseo se ejecuta manualmente por CLI. Ejemplo:

```bash
npm run parse -- --provider openai --product chatgpt --plan free --source data/sources/openai-chatgpt-free.txt
```

El comando debe leer el archivo fuente, invocar el extractor, validar el JSON contra un schema y persistir el resultado en `data/parsed`.

## Persistencia en disco

Cada licencia parseada debe guardarse como un archivo JSON independiente.

Formato sugerido de nombre:

```text
{provider}-{product}-{plan}.json
```

Ejemplos:

```text
openai-chatgpt-free.json
openai-chatgpt-plus.json
anthropic-claude-free.json
anthropic-claude-pro.json
google-gemini-free.json
google-gemini-advanced.json
```

El archivo JSON debe ser legible, indentado y apto para revisión en Git.

## Modelo JSON normalizado

El JSON debe tener una estructura estable. Propuesta inicial:

```json
{
  "id": "openai-chatgpt-free",
  "provider": "OpenAI",
  "product": "ChatGPT",
  "plan": "Free",
  "document": {
    "title": "Terms of Use",
    "source_type": "manual_upload",
    "source_url": null,
    "retrieved_at": "2026-06-13T00:00:00.000Z",
    "effective_date": null,
    "language": "en",
    "raw_source_file": "data/sources/openai-chatgpt-free.txt",
    "hash": "sha256-placeholder"
  },
  "summary": {
    "plain_language": "Resumen claro para usuarios no abogados.",
    "legal_language": "Resumen técnico-jurídico para abogados."
  },
  "findings": {
    "user_privacy": {
      "status": "found",
      "risk_level": "medium",
      "plain_language": "Explica si el proveedor puede usar datos del usuario, con qué fines y bajo qué límites.",
      "legal_language": "Análisis de tratamiento de datos personales, finalidades, bases contractuales, retención, transferencia y eventuales obligaciones de confidencialidad.",
      "evidence": [
        {
          "quote": "Texto exacto de la cláusula relevante.",
          "section": "Privacy",
          "location": "paragraph 12"
        }
      ],
      "requires_review": true
    },
    "input_ownership": {
      "status": "found",
      "risk_level": "low",
      "plain_language": "Indica quién conserva la propiedad del contenido ingresado por el usuario.",
      "legal_language": "Determinación de titularidad sobre inputs, licencias otorgadas al proveedor y restricciones contractuales aplicables.",
      "evidence": []
    },
    "output_ownership": {
      "status": "unclear",
      "risk_level": "medium",
      "plain_language": "No queda completamente claro quién puede explotar comercialmente lo generado.",
      "legal_language": "La cláusula sobre outputs requiere revisión por posible ambigüedad en titularidad, cesión, licencia o renuncia.",
      "evidence": []
    },
    "training_use": {
      "status": "found",
      "risk_level": "high",
      "plain_language": "Indica si el proveedor puede usar conversaciones, archivos o prompts para entrenar modelos.",
      "legal_language": "Evaluación del uso de datos del usuario para entrenamiento, mejora de servicios, investigación, fine-tuning o desarrollo de modelos.",
      "evidence": []
    },
    "security_duty": {
      "status": "found",
      "risk_level": "medium",
      "plain_language": "Describe si el proveedor asume compromisos de seguridad sobre los datos.",
      "legal_language": "Análisis de deber de seguridad, medidas técnicas y organizativas, estándares de seguridad, notificación de incidentes y limitaciones contractuales.",
      "evidence": []
    },
    "confidentiality": {
      "status": "not_found",
      "risk_level": "high",
      "plain_language": "No se encontró una obligación clara de confidencialidad.",
      "legal_language": "No surge una cláusula expresa de confidencialidad aplicable al proveedor respecto de inputs, outputs o archivos cargados.",
      "evidence": []
    },
    "liability_limitation": {
      "status": "found",
      "risk_level": "high",
      "plain_language": "El proveedor limita su responsabilidad frente a daños o errores del servicio.",
      "legal_language": "Identificación de cláusulas de exclusión o limitación de responsabilidad, disclaimers de garantías y topes indemnizatorios.",
      "evidence": []
    },
    "indemnity": {
      "status": "found",
      "risk_level": "medium",
      "plain_language": "El usuario puede tener que defender o indemnizar al proveedor ante ciertos reclamos.",
      "legal_language": "Análisis de cláusulas de indemnidad a cargo del usuario por uso indebido, infracción de derechos de terceros o incumplimiento contractual.",
      "evidence": []
    },
    "jurisdiction": {
      "status": "found",
      "risk_level": "medium",
      "plain_language": "Indica qué ley y tribunales se aplican ante un conflicto.",
      "legal_language": "Determinación de ley aplicable, jurisdicción, arbitraje, renuncia a acciones colectivas y reglas de resolución de disputas.",
      "evidence": []
    },
    "terms_changes": {
      "status": "found",
      "risk_level": "medium",
      "plain_language": "El proveedor puede modificar los términos bajo ciertas condiciones.",
      "legal_language": "Evaluación de facultades de modificación unilateral, notificación, aceptación tácita y efectos sobre usuarios existentes.",
      "evidence": []
    }
  },
  "overall_assessment": {
    "plain_language": "Evaluación general de riesgo para un usuario o empresa que usa este plan.",
    "legal_language": "Calificación jurídica general del documento, con foco en privacidad, PI, seguridad, responsabilidad y gobernanza contractual.",
    "risk_level": "medium",
    "requires_human_review": true
  }
}
```

## Estados permitidos

Para evitar conclusiones ambiguas, usar enums cerrados.

```ts
type FindingStatus = "found" | "not_found" | "unclear" | "not_applicable" | "requires_review";

type RiskLevel = "low" | "medium" | "high" | "critical" | "unknown";
```

La aplicación debe tratar `unclear`, `not_found` y `requires_review` como señales relevantes, no como errores.

## Categorías jurídicas mínimas

El extractor debe intentar completar estas categorías:

1. Privacidad del usuario.
2. Titularidad de inputs.
3. Titularidad de outputs.
4. Uso de inputs, outputs o archivos para entrenamiento.
5. Confidencialidad.
6. Deber de seguridad.
7. Retención o eliminación de datos.
8. Transferencias a terceros.
9. Uso empresarial o comercial permitido.
10. Restricciones de uso.
11. Limitación de responsabilidad.
12. Garantías o disclaimers.
13. Indemnidad.
14. Ley aplicable y jurisdicción.
15. Arbitraje o renuncia a acciones colectivas.
16. Modificación unilateral de términos.
17. Diferencias entre plan gratuito y plan pago.
18. Observaciones que requieren revisión humana.

## Parser

El parser debe recibir texto plano y devolver JSON validado.

Interfaz propuesta:

```ts
export async function parseLicense(input: {
  provider: string;
  product: string;
  plan: string;
  sourceText: string;
  sourceFile: string;
  sourceUrl?: string | null;
  retrievedAt: string;
}): Promise<ParsedLicense>
```

El parser puede usar un LLM para extraer la información, pero el resultado debe pasar por validación estructural con Zod.

```ts
const ParsedLicenseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  product: z.string(),
  plan: z.string(),
  document: z.object({
    title: z.string().nullable(),
    source_type: z.enum(["manual_upload", "url_copy", "other"]),
    source_url: z.string().nullable(),
    retrieved_at: z.string(),
    effective_date: z.string().nullable(),
    language: z.string(),
    raw_source_file: z.string(),
    hash: z.string()
  }),
  summary: z.object({
    plain_language: z.string(),
    legal_language: z.string()
  }),
  findings: z.record(z.object({
    status: z.enum(["found", "not_found", "unclear", "not_applicable", "requires_review"]),
    risk_level: z.enum(["low", "medium", "high", "critical", "unknown"]),
    plain_language: z.string(),
    legal_language: z.string(),
    evidence: z.array(z.object({
      quote: z.string(),
      section: z.string().nullable(),
      location: z.string().nullable()
    })),
    requires_review: z.boolean()
  })),
  overall_assessment: z.object({
    plain_language: z.string(),
    legal_language: z.string(),
    risk_level: z.enum(["low", "medium", "high", "critical", "unknown"]),
    requires_human_review: z.boolean()
  })
});
```

## Prompt base para extracción

El prompt debe instruir al modelo a comportarse como extractor jurídico, no como asesor legal final.

```text
You are extracting structured legal information from an AI provider license, EULA, Terms of Service, Privacy Policy, or equivalent document.

Return only valid JSON matching the provided schema.

Rules:
- Do not invent legal conclusions.
- Every finding must include textual evidence if the relevant clause is present.
- If the clause is absent, use status "not_found".
- If the clause exists but is ambiguous, use status "unclear".
- If human legal interpretation is required, set requires_review to true.
- Separate plain-language explanations from lawyer-facing legal analysis.
- Identify privacy, intellectual property, security duties, liability limits, indemnity, jurisdiction, and terms-change provisions.
- If the document distinguishes free and paid plans, capture the distinction.
- If the document does not distinguish plans, state that no distinction was found.
```

## CLI de parseo

Crear un script:

```text
scripts/parse-one.ts
```

Uso:

```bash
npm run parse -- --provider "OpenAI" --product "ChatGPT" --plan "Free" --source "data/sources/openai-chatgpt-free.txt"
```

Responsabilidades:

1. Leer argumentos.
2. Leer archivo fuente.
3. Calcular hash SHA-256 del texto fuente.
4. Ejecutar parser.
5. Validar resultado con Zod.
6. Guardar JSON en `data/parsed/{provider-product-plan}.json`.
7. Mostrar en consola la ruta generada.

No debe haber escritura en base de datos.

## Carga de datos en la vista

La vista debe leer todos los archivos JSON dentro de `data/parsed`.

Función propuesta:

```ts
export async function loadParsedLicenses(): Promise<ParsedLicense[]> {
  const dir = path.join(process.cwd(), "data", "parsed");
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  const licenses = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      return ParsedLicenseSchema.parse(JSON.parse(raw));
    })
  );

  return licenses;
}
```

## Vista principal

La vista principal debe mostrar una matriz comparativa.

Columnas sugeridas:

1. Proveedor.
2. Producto.
3. Plan.
4. Privacidad.
5. Propiedad de inputs.
6. Propiedad de outputs.
7. Uso para entrenamiento.
8. Deber de seguridad.
9. Confidencialidad.
10. Responsabilidad.
11. Indemnidad.
12. Jurisdicción.
13. Riesgo general.

Cada celda debe mostrar:

1. Estado.
2. Nivel de riesgo.
3. Resumen breve según el modo seleccionado.
4. Botón o expansión para ver evidencia textual.

Debe existir un toggle global:

```text
Lenguaje claro | Lenguaje para abogados
```

Cuando el usuario elige "lenguaje claro", cada celda usa `plain_language`. Cuando elige "lenguaje para abogados", usa `legal_language`.

## Vista de detalle

Al seleccionar un proveedor/plan, abrir una vista de detalle con:

1. Datos del documento.
2. Resumen general.
3. Hallazgos por categoría.
4. Evidencia textual.
5. Estado de revisión.
6. Riesgo general.

La evidencia textual debe ser visible y copiable. No debe quedar escondida detrás de la conclusión.

## Diseño visual

La UI debe ser sobria y orientada a lectura jurídica.

Componentes mínimos:

```text
ProviderMatrix
LicenseDetail
EvidencePanel
LanguageToggle
RiskBadge
StatusBadge
```

No se requiere diseño complejo. Priorizar claridad, densidad informativa y trazabilidad.

## Reglas de visualización

Para cada hallazgo:

Si `status = found`, mostrar la conclusión y la evidencia.

Si `status = not_found`, mostrar que no se encontró una cláusula específica en el documento analizado.

Si `status = unclear`, mostrar advertencia de ambigüedad y requerir revisión.

Si `requires_review = true`, mostrar una marca visible: "Requiere revisión humana".

Si no hay evidencia y el status es `found`, marcar inconsistencia del parser.

## Stack recomendado

Opción simple recomendada:

```text
Next.js
TypeScript
Zod
Node fs
OpenAI SDK o Anthropic SDK para extracción
Tailwind opcional
```

No usar:

```text
PostgreSQL
Prisma
Redis
BullMQ
Workers
Cron obligatorio
Scrapers complejos
Autenticación
Multiusuario
```

## Implementación sugerida por etapas

### Etapa 1: Estructura del proyecto

Crear una app Next.js con TypeScript.

Directorios:

```text
data/sources
data/parsed
src/parser
src/lib
src/app/components
scripts
```

### Etapa 2: Schema

Definir `ParsedLicenseSchema` con Zod.

Exportar los tipos TypeScript inferidos:

```ts
export type ParsedLicense = z.infer<typeof ParsedLicenseSchema>;
```

### Etapa 3: Parser mock

Antes de conectar un LLM, crear un parser mock que devuelva JSON válido. Esto permite construir la UI sin depender del modelo.

### Etapa 4: Persistencia

Crear `scripts/parse-one.ts`.

Debe escribir archivos JSON en `data/parsed`.

### Etapa 5: UI

Crear la vista principal que lee JSON desde disco y renderiza la matriz.

### Etapa 6: Toggle de lenguaje

Agregar estado local para alternar entre `plain_language` y `legal_language`.

### Etapa 7: Evidencia

Agregar panel de evidencia por cada hallazgo.

### Etapa 8: LLM real

Conectar el parser al proveedor LLM elegido.

El LLM debe devolver JSON estricto. Si el JSON falla validación, guardar el error en consola y no persistir el archivo.

## Criterios de aceptación

El MVP se considera aceptado si:

1. Puedo colocar un archivo `.txt` en `data/sources`.
2. Puedo correr un comando de parseo manual.
3. Se genera un `.json` en `data/parsed`.
4. La app web carga todos los JSON parseados.
5. La matriz muestra proveedores, productos y planes.
6. Puedo alternar entre lenguaje claro y lenguaje jurídico.
7. Puedo ver evidencia textual por cada conclusión.
8. No hay PostgreSQL, Prisma, Redis ni workers.
9. El JSON puede ser versionado en Git.
10. Una conclusión sin evidencia queda marcada como inconsistente o requiere revisión.

## Prompt inicial para Claude Code

```text
Create a simple TypeScript Next.js application named ai-license-observatory.

Do not use PostgreSQL, Prisma, Redis, queues, workers, authentication, or multi-user infrastructure.

The app must parse one license document at a time, persist the extracted result as a JSON file on disk, and display all parsed JSON files in a web view.

Use this architecture:

- data/sources: raw license text files.
- data/parsed: parsed JSON files.
- scripts/parse-one.ts: CLI script that reads one source file, parses it, validates the result, and writes JSON to data/parsed.
- src/parser/schema.ts: Zod schema for ParsedLicense.
- src/parser/parseLicense.ts: parser function. Start with a mock parser, then make it replaceable by an LLM-based parser.
- src/lib/loadParsedLicenses.ts: loads and validates all JSON files from data/parsed.
- src/app/page.tsx: main view.
- src/app/components: matrix, detail panel, evidence panel, language toggle, status badge, risk badge.

The UI must show one single view with two language modes:
1. plain language;
2. lawyer-facing legal language.

The JSON must contain:
- provider;
- product;
- plan;
- document metadata;
- plain-language summary;
- legal-language summary;
- findings by legal category;
- evidence quotes;
- risk level;
- review status.

Important rules:
- Never hardcode legal conclusions in the UI.
- Never invent findings.
- Every finding with status "found" must have textual evidence.
- If evidence is missing, mark the finding as requiring review.
- The JSON file on disk is the source of truth.
- Keep the code simple and explicit.
```

## Fuera de alcance

Queda fuera del MVP:

1. Captura periódica automática.
2. Scraping robusto.
3. Versionado histórico de términos.
4. Base de datos.
5. Gestión de usuarios.
6. Alertas.
7. Workflow formal de aprobación legal.
8. Integraciones empresariales.
9. Comparación semántica entre versiones.
10. Generación automática de reportes PDF.

Estos puntos pueden agregarse en una segunda versión si el observatorio necesita pasar de herramienta local a producto interno o SaaS.
