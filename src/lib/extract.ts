/**
 * Extracción de texto plano, sin dependencias externas.
 *
 * - HTML  -> se quitan script/style/nav/header/footer, se convierten bloques en
 *            saltos de línea, se decodifican entidades y se normaliza el espacio.
 * - texto -> se normaliza el espacio conservando saltos de sección.
 * - PDF   -> NO soportado en el MVP (se marca unsupported_format aguas arriba).
 *
 * IMPORTANTE (seguridad): esta función produce TEXTO, nunca HTML. El contenido
 * descargado jamás se renderiza como HTML en la UI.
 */

import type { ExtractionMethod } from "./schema";

export type FetchedFormat = "html" | "pdf" | "text" | "unknown";

/** Detecta el formato a partir del content-type y/o los primeros bytes. */
export function detectFormat(contentType: string | null, body: Buffer): FetchedFormat {
  const ct = (contentType ?? "").toLowerCase();
  const head = body.subarray(0, 8).toString("latin1");
  if (head.startsWith("%PDF")) return "pdf";
  if (ct.includes("application/pdf")) return "pdf";
  if (ct.includes("text/html") || ct.includes("application/xhtml")) return "html";
  if (/<html[\s>]/i.test(body.subarray(0, 2000).toString("utf8"))) return "html";
  if (ct.includes("text/plain")) return "text";
  return "unknown";
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”", copy: "©", reg: "®", trade: "™", deg: "°",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

function safeCodePoint(cp: number): string {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}

/** Convierte HTML en texto plano legible. */
export function htmlToText(html: string): string {
  let text = html;
  // Quita bloques cuyo contenido no es texto legible del documento.
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<(script|style|noscript|svg|head|template|iframe)\b[\s\S]*?<\/\1>/gi, " ");
  // Quita navegación/encabezados/pies de página estructurales (best-effort).
  text = text.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ");
  // Encabezados y bloques -> saltos de línea.
  text = text.replace(/<\/(p|div|section|article|li|tr|h[1-6]|blockquote|ul|ol|table)>/gi, "\n");
  text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");
  text = text.replace(/<h[1-6]\b[^>]*>/gi, "\n\n");
  text = text.replace(/<li\b[^>]*>/gi, "\n• ");
  // Quita el resto de etiquetas.
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);
  // Normaliza el espacio conservando saltos de sección.
  text = text.replace(/[ \t\f\v]+/g, " ");
  text = text.replace(/ *\n */g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/** Normaliza texto plano conservando saltos de sección. */
export function normalizePlainText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Detecta la URL canónica declarada en el HTML, si existe. */
export function detectCanonicalUrl(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const href = m[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

// --- Puerta de validez de contenido --------------------------------------

const MIN_TEXT_CHARS = 800;
const MIN_LEGAL_MARKERS = 3;

const LEGAL_MARKERS = [
  "terms", "privacy", "policy", "agreement", "license", "liability",
  "conditions", "rights", "data", "service", "warrant", "indemn",
  "arbitration", "jurisdiction", "governing law", "intellectual property",
  "acceptable use", "personal information", "términos", "privacidad",
];

export interface ContentValidity {
  ok: boolean;
  chars: number;
  markerCount: number;
  reason?: string;
}

/**
 * Decide si el texto extraído parece un documento legal real (y no un soft-404,
 * un muro de consentimiento o el cascarón de una SPA renderizada por JS).
 */
export function assessContentValidity(text: string): ContentValidity {
  const chars = text.length;
  const lower = text.toLowerCase();
  const markerCount = LEGAL_MARKERS.reduce((n, m) => (lower.includes(m) ? n + 1 : n), 0);

  if (chars < MIN_TEXT_CHARS) {
    return { ok: false, chars, markerCount, reason: `texto demasiado corto (${chars} < ${MIN_TEXT_CHARS} chars): posible SPA, muro de consentimiento o soft-404` };
  }
  if (markerCount < MIN_LEGAL_MARKERS) {
    return { ok: false, chars, markerCount, reason: `sin marcadores legales suficientes (${markerCount} < ${MIN_LEGAL_MARKERS}): el contenido no parece un documento legal` };
  }
  return { ok: true, chars, markerCount };
}

/** Resultado de una extracción. */
export interface ExtractionResult {
  text: string;
  method: ExtractionMethod;
  canonicalUrl: string | null;
  validity: ContentValidity;
}

/** Extrae texto según el formato detectado y evalúa su validez. */
export function extractText(format: FetchedFormat, body: Buffer): ExtractionResult {
  if (format === "html") {
    const html = body.toString("utf8");
    const text = htmlToText(html);
    return {
      text,
      method: "html-to-text",
      canonicalUrl: detectCanonicalUrl(html),
      validity: assessContentValidity(text),
    };
  }
  if (format === "text") {
    const text = normalizePlainText(body.toString("utf8"));
    return { text, method: "plain-text", canonicalUrl: null, validity: assessContentValidity(text) };
  }
  // pdf / unknown: no extraído en el MVP.
  return {
    text: "",
    method: "none",
    canonicalUrl: null,
    validity: { ok: false, chars: 0, markerCount: 0, reason: `formato no soportado: ${format}` },
  };
}
