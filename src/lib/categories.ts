/**
 * Catálogo canónico de categorías jurídicas analizadas por UP-Law-AILO.
 *
 * Esta es la ÚNICA fuente de verdad de las categorías. El parser, el schema Zod
 * y la UI derivan todo de aquí, de modo que agregar una categoría nueva sea un
 * cambio en un solo lugar.
 *
 * Cada categoría declara:
 *  - key:           identificador estable usado como clave en el JSON.
 *  - label:         nombre legible en español para la UI.
 *  - concern:       descripción en lenguaje claro (para usuarios no abogados).
 *  - legalConcern:  descripción técnico-jurídica (para abogados).
 *  - strongKeywords:    coincidencias que sugieren con fuerza la presencia del tema.
 *  - ambiguousKeywords: coincidencias débiles; si solo aparecen estas, el estado
 *                       debe quedar como "unclear".
 *  - riskWhenFound:     nivel de riesgo base cuando el tema aparece en el texto.
 *  - inMatrix:          si la categoría se muestra como fila en la matriz comparativa.
 */

import type { RiskLevel } from "./types";

export interface CategoryConfig {
  key: string;
  label: string;
  concern: string;
  legalConcern: string;
  strongKeywords: string[];
  ambiguousKeywords: string[];
  riskWhenFound: RiskLevel;
  inMatrix: boolean;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: "privacy",
    label: "Privacidad del usuario",
    concern: "cómo se procesan los datos personales del usuario",
    legalConcern: "el tratamiento de datos personales del usuario y sus finalidades",
    strongKeywords: ["privacy policy", "personal data", "personal information", "process your data", "process user", "data protection", "gdpr", "ccpa"],
    ambiguousKeywords: ["privacy", "your data", "information we collect"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "training_use",
    label: "Uso de datos para entrenamiento",
    concern: "si el proveedor podría usar tus conversaciones o archivos para entrenar sus modelos",
    legalConcern: "el uso de inputs, outputs o archivos del usuario para entrenamiento o mejora de modelos",
    strongKeywords: ["train our models", "training our models", "model improvement", "improve our models", "to train", "used for training", "machine learning models"],
    ambiguousKeywords: ["training", "improve our services", "improve the service", "model"],
    riskWhenFound: "high",
    inMatrix: true,
  },
  {
    key: "input_ip",
    label: "Propiedad intelectual del input",
    concern: "quién es dueño del contenido que ingresás (tus prompts y archivos)",
    legalConcern: "la titularidad de los inputs aportados por el usuario",
    strongKeywords: ["you retain", "you own your", "ownership of input", "your content", "retain ownership", "rights you have in your"],
    ambiguousKeywords: ["input", "your prompts", "content you provide"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "output_ip",
    label: "Propiedad intelectual del output",
    concern: "quién es dueño de lo que genera la IA a partir de tus pedidos",
    legalConcern: "la asignación de titularidad sobre los outputs generados por el servicio",
    strongKeywords: ["ownership of output", "we assign to you", "rights in the output", "own the output", "output generated", "you own the output"],
    ambiguousKeywords: ["output", "generated content", "results of the service"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "license_grant",
    label: "Licencia concedida al proveedor",
    concern: "qué permisos le das al proveedor sobre tu contenido",
    legalConcern: "la licencia conferida al proveedor sobre los contenidos del usuario",
    strongKeywords: ["grant us a license", "grant a license", "license to use", "royalty-free", "worldwide license", "you grant"],
    ambiguousKeywords: ["license", "permission to use", "rights to use"],
    riskWhenFound: "high",
    inMatrix: true,
  },
  {
    key: "data_retention",
    label: "Retención de datos",
    concern: "cuánto tiempo se conserva tu información",
    legalConcern: "los plazos y condiciones de retención de datos del usuario",
    strongKeywords: ["data retention", "retention period", "we retain", "retained for", "store your data", "we store"],
    ambiguousKeywords: ["retain", "retention", "storage", "store"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "data_deletion",
    label: "Eliminación de datos",
    concern: "si y cómo podés pedir que borren tu información",
    legalConcern: "los mecanismos de supresión o eliminación de datos del usuario",
    strongKeywords: ["delete your data", "deletion of data", "right to delete", "we will delete", "request deletion", "erase your data"],
    ambiguousKeywords: ["delete", "deletion", "remove your", "erase"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "confidentiality",
    label: "Confidencialidad",
    concern: "si el proveedor se compromete a mantener tu información en reserva",
    legalConcern: "las obligaciones de confidencialidad aplicables al proveedor",
    strongKeywords: ["confidential information", "confidentiality", "keep confidential", "non-disclosure", "treat as confidential"],
    ambiguousKeywords: ["confidential", "private"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "security",
    label: "Seguridad",
    concern: "qué medidas de seguridad dice tomar el proveedor",
    legalConcern: "las medidas técnicas y organizativas de seguridad declaradas",
    strongKeywords: ["security measures", "safeguards", "reasonable measures", "encryption", "protect your data", "technical and organizational"],
    ambiguousKeywords: ["security", "protect", "secure"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "security_duty",
    label: "Deber de seguridad",
    concern: "si el proveedor asume un compromiso concreto de seguridad",
    legalConcern: "la existencia de un deber de seguridad exigible al proveedor",
    strongKeywords: ["we are responsible for", "our responsibility to secure", "duty to protect", "obligation to maintain security", "shall maintain security"],
    ambiguousKeywords: ["responsible for security", "ensure security"],
    riskWhenFound: "medium",
    inMatrix: false,
  },
  {
    key: "warranties",
    label: "Garantías y disclaimers",
    concern: "qué garantiza (o no garantiza) el proveedor sobre el servicio",
    legalConcern: "las garantías otorgadas y los disclaimers de garantía",
    strongKeywords: ["as is", "as-is", "without warranty", "no warranty", "disclaim all warranties", "warranties of any kind", "merchantability"],
    ambiguousKeywords: ["warranty", "warranties", "guarantee"],
    riskWhenFound: "high",
    inMatrix: false,
  },
  {
    key: "liability_limitation",
    label: "Limitación de responsabilidad",
    concern: "hasta dónde responde el proveedor si algo sale mal",
    legalConcern: "el régimen de exclusión o limitación de responsabilidad",
    strongKeywords: ["limitation of liability", "limited liability", "not be liable", "shall not be liable", "in no event", "aggregate liability", "consequential damages"],
    ambiguousKeywords: ["liability", "damages", "liable"],
    riskWhenFound: "high",
    inMatrix: true,
  },
  {
    key: "indemnity",
    label: "Indemnidad",
    concern: "si tenés que defender o pagar al proveedor ante reclamos de terceros",
    legalConcern: "las obligaciones de indemnidad a cargo del usuario",
    strongKeywords: ["you will indemnify", "indemnify and hold harmless", "indemnification", "hold us harmless", "defend us"],
    ambiguousKeywords: ["indemnify", "indemnity", "hold harmless"],
    riskWhenFound: "high",
    inMatrix: false,
  },
  {
    key: "governing_law",
    label: "Ley aplicable",
    concern: "qué ley rige el contrato",
    legalConcern: "la ley aplicable al contrato",
    strongKeywords: ["governing law", "governed by the laws", "laws of the state", "applicable law", "shall be governed by"],
    ambiguousKeywords: ["governing", "under the laws"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "jurisdiction",
    label: "Jurisdicción",
    concern: "qué tribunales resolverían un conflicto",
    legalConcern: "la jurisdicción y el foro competente",
    strongKeywords: ["exclusive jurisdiction", "courts located in", "venue", "submit to the jurisdiction", "courts of"],
    ambiguousKeywords: ["jurisdiction", "courts"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "arbitration",
    label: "Arbitraje y renuncia a acciones colectivas",
    concern: "si tenés que resolver disputas por arbitraje y si renunciás a demandas colectivas",
    legalConcern: "el sometimiento a arbitraje y la renuncia a acciones colectivas",
    strongKeywords: ["binding arbitration", "arbitration agreement", "class action waiver", "waive any right to a jury", "arbitrate"],
    ambiguousKeywords: ["arbitration", "dispute resolution"],
    riskWhenFound: "high",
    inMatrix: true,
  },
  {
    key: "unilateral_changes",
    label: "Cambios unilaterales de términos",
    concern: "si el proveedor puede cambiar las reglas cuando quiera",
    legalConcern: "las facultades de modificación unilateral de los términos",
    strongKeywords: ["we may modify", "changes to these terms", "update these terms", "we reserve the right to change", "may revise these terms", "modify these terms"],
    ambiguousKeywords: ["changes", "modify", "update", "revise"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "plan_differences",
    label: "Diferencias entre planes gratuitos y pagos / enterprise",
    concern: "si las reglas cambian según el plan que tengas (gratis, pago, empresa)",
    legalConcern: "las diferencias de régimen entre planes gratuitos, pagos y enterprise/business/team",
    strongKeywords: ["free plan", "paid plan", "enterprise", "business plan", "team plan", "subscription tier", "for paid accounts", "for free accounts"],
    ambiguousKeywords: ["plan", "subscription", "tier", "premium"],
    riskWhenFound: "medium",
    inMatrix: true,
  },
  {
    key: "minors",
    label: "Referencias a menores de edad",
    concern: "qué dice el documento sobre el uso por menores de edad",
    legalConcern: "el tratamiento del uso del servicio por menores de edad",
    strongKeywords: ["under the age of", "minimum age", "children under", "not directed to children", "13 years", "18 years", "parental consent"],
    ambiguousKeywords: ["minor", "child", "children", "age"],
    riskWhenFound: "medium",
    inMatrix: false,
  },
  {
    key: "prohibited_content",
    label: "Contenido prohibido / usos restringidos",
    concern: "qué usos del servicio están prohibidos",
    legalConcern: "las restricciones de uso y las categorías de contenido prohibido",
    strongKeywords: ["prohibited", "prohibited uses", "you may not", "acceptable use", "usage policies", "restricted uses", "not permitted to"],
    ambiguousKeywords: ["restrictions", "must not", "may not use"],
    riskWhenFound: "medium",
    inMatrix: false,
  },
  {
    key: "commercial_use",
    label: "Uso comercial",
    concern: "si podés usar el servicio con fines comerciales",
    legalConcern: "la habilitación o restricción del uso comercial del servicio",
    strongKeywords: ["commercial use", "commercial purposes", "for business use", "commercially exploit"],
    ambiguousKeywords: ["commercial", "business use"],
    riskWhenFound: "low",
    inMatrix: true,
  },
  {
    key: "api_references",
    label: "Referencias a APIs",
    concern: "si el documento menciona el uso de APIs y sus condiciones",
    legalConcern: "las condiciones aplicables al uso de APIs",
    strongKeywords: ["api", "api key", "rate limit", "developer terms", "api terms"],
    ambiguousKeywords: ["endpoint", "integration"],
    riskWhenFound: "low",
    inMatrix: false,
  },
];

/** Lista de claves canónicas en orden de catálogo. */
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

/** Búsqueda rápida por clave. */
export const CATEGORY_BY_KEY: Record<string, CategoryConfig> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
);

/** Categorías que se muestran como filas en la matriz comparativa. */
export const MATRIX_CATEGORIES = CATEGORIES.filter((c) => c.inMatrix);
