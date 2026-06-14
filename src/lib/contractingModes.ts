/**
 * Modalidades de contratación normalizadas.
 *
 * `contractingMode` es la normalización de UP-Law-AILO (distinta de
 * `productTier`, que es la etiqueta del proveedor). La modalidad debe surgir de
 * la fuente / del documento / de evidencia textual clara; si no surge, es
 * `unknown`. `all` solo cuando el documento aplica de forma general.
 */

export const CONTRACTING_MODES = [
  "free",
  "paid_individual",
  "team",
  "business",
  "enterprise",
  "api",
  "education",
  "open_source",
  "unknown",
  "all",
] as const;

export type ContractingMode = (typeof CONTRACTING_MODES)[number];

export const MODE_LABELS: Record<ContractingMode, string> = {
  free: "Gratuito",
  paid_individual: "Pago individual",
  team: "Team",
  business: "Business",
  enterprise: "Enterprise",
  api: "API",
  education: "Educación",
  open_source: "Open source",
  unknown: "Desconocida",
  all: "Aplicación general",
};

/** Texto explicativo para `all` (no mostrar la etiqueta pelada). */
export const ALL_MODE_EXPLANATION =
  "Aplicación general: el documento no distingue claramente por modalidad.";

/**
 * Señales léxicas por modalidad. Se usan para (a) corroborar la modalidad de un
 * documento, (b) anotar categorías con `appliesToModes`. No definen la
 * modalidad por sí solas: la fuente (registro) es la autoridad.
 */
export const MODE_KEYWORDS: Record<Exclude<ContractingMode, "all" | "unknown">, string[]> = {
  free: ["free plan", "free tier", "free account", "free version", "free users", "free of charge", "no cost"],
  paid_individual: ["paid plan", "paid subscription", "paid account", "pro plan", "plus plan", "premium plan", "individual subscription", "subscriber", "paid users", "paid tier"],
  team: ["team plan", "team account", "team workspace", "teams plan", "for teams"],
  business: ["business plan", "business account", "for business", "business subscription", "commercial customers"],
  enterprise: ["enterprise", "enterprise plan", "enterprise account", "enterprise customers", "enterprise agreement", "enterprise terms"],
  api: ["api terms", "developer terms", "api key", "rate limit", "through the api", "api access", "the api"],
  education: ["education plan", "educational", "for students", "academic", "edu account"],
  open_source: ["open source", "open-source", "open weights", "community license", "apache license", "mit license", "open model"],
};

/**
 * Frases FUERTES de modalidad: solo cuentan como diferenciación cuando además
 * co-ocurren con lenguaje de diferenciación (ver parser). Excluye menciones al
 * pasar (p. ej. "enterprise-grade", "the API", "Enterprise Support") que NO
 * implican términos distintos por modalidad.
 */
export const STRONG_MODE_PHRASES: Record<Exclude<ContractingMode, "all" | "unknown">, string[]> = {
  free: ["free plan", "free tier", "free account", "free users", "free version", "free subscription"],
  paid_individual: ["paid plan", "paid subscription", "paid account", "paid users", "pro plan", "plus plan", "premium plan", "individual subscription"],
  team: ["team plan", "team account", "teams plan", "for teams"],
  business: ["business plan", "business account", "business customers", "business clients", "for business"],
  enterprise: ["enterprise plan", "enterprise account", "enterprise customers", "enterprise terms", "enterprise agreement", "enterprise pilot", "for enterprise"],
  api: ["api terms", "developer terms", "developer agreement"],
  education: ["education plan", "educational plan", "for students", "academic plan"],
  open_source: ["open source license", "open-source license", "community license", "open weights", "open model license"],
};

/** Cues de diferenciación por modalidad (deben acompañar a una frase fuerte). */
export const DIFFERENTIATION_CUE =
  /(appl(?:y|ies|icable)|govern|receive[sd]?|\bonly\b|unless|except|additional terms|separate terms|differ|different|subject to|exclusive to|available (?:only )?to|reserved for|for (?:free|paid|team|business|enterprise|api|education|individual))/i;

/** Mapea el `productTier` del proveedor a la modalidad normalizada. */
export function tierToMode(tier: string): ContractingMode {
  const t = tier.trim().toLowerCase();
  if (!t || t === "all") return "all";
  if (/(free|basic|starter|trial|essentials)/.test(t)) return "free";
  if (/(plus|pro|premium|advanced|individual|standard|core|creator|mega)/.test(t)) return "paid_individual";
  if (/team/.test(t)) return "team";
  if (/business|commercial/.test(t)) return "business";
  if (/enterprise/.test(t)) return "enterprise";
  if (/\bapi\b|developer|production|on-demand|provisioned/.test(t)) return "api";
  if (/education|academic|student/.test(t)) return "education";
  if (/open|community|llama|weights/.test(t)) return "open_source";
  return "unknown";
}

export function isContractingMode(x: string): x is ContractingMode {
  return (CONTRACTING_MODES as readonly string[]).includes(x);
}
