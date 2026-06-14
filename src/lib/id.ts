/**
 * Generación de identificadores estables para los análisis.
 *
 * El id determina el nombre de los archivos en disco, por lo que debe ser
 * estable y reproducible a partir de los mismos datos de entrada.
 */

/** Convierte un texto arbitrario en un slug seguro para nombres de archivo. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // todo lo no alfanumérico -> guion
    .replace(/^-+|-+$/g, "") // recorta guiones de los extremos
    .replace(/-{2,}/g, "-"); // colapsa guiones repetidos
}

/** Toma la parte de fecha (YYYY-MM-DD) de un timestamp ISO o de una fecha simple. */
export function toDatePart(retrievedAt: string): string {
  const trimmed = retrievedAt.trim();
  // Si ya viene como YYYY-MM-DD, lo respetamos.
  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return slugify(trimmed) || "sin-fecha";
}

/**
 * Construye el id estable de un documento ingerido, a partir de los ids del
 * registro de proveedores. Ejemplo:
 *   openai-chatgpt-terms-of-use-2026-06-14
 */
export function buildDocumentId(parts: {
  providerId: string;
  productId: string;
  documentId: string;
  datePart: string;
}): string {
  return [
    slugify(parts.providerId),
    slugify(parts.productId),
    slugify(parts.documentId),
    parts.datePart,
  ]
    .filter(Boolean)
    .join("-");
}

/**
 * Construye el id estable a partir de proveedor, producto, plan, tipo de
 * documento y fecha. Ejemplo:
 *   openai-chatgpt-plus-terms-of-use-2026-06-14
 */
export function buildAnalysisId(parts: {
  providerName: string;
  productName: string;
  productTier: string;
  documentType: string;
  retrievedAt: string;
}): string {
  return [
    slugify(parts.providerName),
    slugify(parts.productName),
    slugify(parts.productTier),
    slugify(parts.documentType),
    toDatePart(parts.retrievedAt),
  ]
    .filter(Boolean)
    .join("-");
}
