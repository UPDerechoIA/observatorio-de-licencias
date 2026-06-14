/**
 * Tipos base compartidos. Los tipos completos del análisis se infieren desde
 * el schema Zod (ver schema.ts) para mantener una sola fuente de verdad.
 */

export type FindingStatus = "found" | "not_found" | "unclear";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type ReviewStatus = "unreviewed" | "needs_legal_review" | "reviewed" | "rejected";

export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "unknown"];

export const FINDING_STATUSES: FindingStatus[] = ["found", "not_found", "unclear"];
