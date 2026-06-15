/**
 * Paquetes jurídicos por producto (legal bundles / coverage records).
 *
 * Un producto NO se cierra con "lo cubren los términos generales". Su régimen se
 * reconstruye como un PAQUETE: documentos base (referenciados, no duplicados),
 * documentos específicos del producto, documentos por modalidad, y lo que quedó
 * sin encontrar tras una búsqueda en fuentes oficiales.
 *
 * Vive en `data/coverage/*.json` (disco = fuente de verdad), validado por Zod.
 * Vocabulario propio de esta capa (no toca el `SourceStatus` del análisis).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ContractingModeSchema, SoftwareCategorySchema, ComparisonGroupSchema } from "./schema";

export const DocumentRoleSchema = z.enum([
  "base_terms",
  "base_privacy",
  "product_terms",
  "program_policy",
  "legal_notice",
  "workspace_terms",
  "enterprise_terms",
  "education_terms",
  "ai_feature_terms",
  "admin_policy",
  "unknown",
]);

/** Estados precisos de cobertura (no usar como cajón de sastre). */
export const CoverageStatusSchema = z.enum([
  "verified_base_document",
  "verified_product_specific",
  "referenced_canonical_document",
  "not_found_after_official_search",
  "unclear_scope",
  "needs_manual_review",
  "unsupported_format",
  "failed_fetch",
]);

export const RelationshipSchema = z.enum([
  "applies_by_official_reference",
  "product_specific",
  "workspace_or_organization_specific",
  "ai_feature",
  "unclear",
]);

export const BundleDocumentSchema = z.object({
  documentRole: DocumentRoleSchema,
  documentType: z.string(),
  sourceUrl: z.string().url().nullable(),
  status: CoverageStatusSchema,
  relationship: RelationshipSchema.optional(),
  /** Si remite a un análisis canónico existente, su id (no se duplica contenido). */
  canonicalAnalysisId: z.string().nullable().default(null),
  appliesToModes: z.array(ContractingModeSchema).default([]),
  /** Cita textual oficial que respalda la relación de aplicabilidad. */
  evidenceQuote: z.string().default(""),
  notes: z.string().default(""),
});

export const UnresolvedDocumentSchema = z.object({
  documentType: z.string(),
  reason: z.string(),
  status: CoverageStatusSchema,
});

export const LegalBundleSchema = z.object({
  bundleId: z.string(),
  providerName: z.string(),
  productName: z.string(),
  softwareCategory: SoftwareCategorySchema,
  comparisonGroup: ComparisonGroupSchema,
  comparativeBaseline: z.boolean().default(true),
  bundleStatus: z.enum(["resolved", "partially_resolved", "unresolved"]),
  retrievedAt: z.string(),
  summary: z.string(),
  documents: z.array(BundleDocumentSchema).default([]),
  unresolved: z.array(UnresolvedDocumentSchema).default([]),
});

export type DocumentRole = z.infer<typeof DocumentRoleSchema>;
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;
export type BundleDocument = z.infer<typeof BundleDocumentSchema>;
export type LegalBundle = z.infer<typeof LegalBundleSchema>;

const COVERAGE_DIR = path.join(process.cwd(), "data", "coverage");

/** Carga y valida todos los paquetes jurídicos de data/coverage. */
export async function loadAllLegalBundles(): Promise<LegalBundle[]> {
  let files: string[];
  try {
    files = (await fs.readdir(COVERAGE_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const bundles = await Promise.all(
    files.map(async (f) => LegalBundleSchema.parse(JSON.parse(await fs.readFile(path.join(COVERAGE_DIR, f), "utf8")))),
  );
  return bundles.sort((a, b) => a.productName.localeCompare(b.productName));
}

export const DOCUMENT_ROLE_LABEL: Record<DocumentRole, string> = {
  base_terms: "Términos base",
  base_privacy: "Privacidad base",
  product_terms: "Términos del producto",
  program_policy: "Políticas de programa",
  legal_notice: "Aviso legal",
  workspace_terms: "Términos de Workspace",
  enterprise_terms: "Términos enterprise",
  education_terms: "Términos de educación",
  ai_feature_terms: "Términos de funciones de IA",
  admin_policy: "Política administrativa",
  unknown: "Sin clasificar",
};

export const COVERAGE_STATUS_LABEL: Record<CoverageStatus, string> = {
  verified_base_document: "Documento base verificado",
  verified_product_specific: "Específico del producto, verificado",
  referenced_canonical_document: "Referencia a documento canónico",
  not_found_after_official_search: "No encontrado tras búsqueda oficial",
  unclear_scope: "Alcance no determinado",
  needs_manual_review: "Requiere revisión manual",
  unsupported_format: "Formato no soportado",
  failed_fetch: "Falló la descarga",
};
