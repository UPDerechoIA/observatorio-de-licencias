import { describe, it, expect } from "vitest";
import type { LicenseAnalysis } from "../src/lib/schema";
import {
  getReadingGuide,
  getAllReadingGuides,
  getDocumentsForReadingGuide,
  prioritizeDocumentsForReading,
  getClausesForReadingGuide,
} from "../src/domain/readingGuides";

function cat(status: "found" | "unclear" | "not_found", quotes = 1) {
  return { status, riskLevel: "medium", legalSummary: "", evidence: Array.from({ length: quotes }, () => ({ quote: "q", locationHint: "x" })), notes: "", appliesToModes: [], modeSpecificity: "general", modeEvidence: [] };
}

function mk(id: string, cats: Record<string, ReturnType<typeof cat>>): LicenseAnalysis {
  return {
    id,
    providerName: "Prov",
    productName: "Prod",
    productTier: "All",
    documentType: "Privacy Policy",
    softwareCategory: "ai_provider",
    comparisonGroup: "ai",
    comparativeBaseline: false,
    academicPurposeNotes: "",
    contractingMode: "all" as never,
    appliesToModes: [] as never,
    sourceScope: "general" as never,
    modeConfidence: "unknown" as never,
    modeRationale: "",
    sourceUrl: null,
    retrievedAt: "2026-06-15",
    rawTextPath: "x",
    overall: { legalSummary: "", overallRiskLevel: "medium" },
    privacy: { posture: "unknown", rationale: "", signals: [], evidence: [] },
    categories: cats as never,
    metadata: { createdAt: "t", parserVersion: "t", isMock: false, reviewStatus: "unreviewed" },
  } as LicenseAnalysis;
}

describe("getReadingGuide", () => {
  it("existe para datos personales y trae categorías prioritarias y documentos requeridos", () => {
    const g = getReadingGuide("personal_data");
    expect(g).toBeTruthy();
    expect(g!.priorityCategories.length).toBeGreaterThan(0);
    expect(g!.requiredDocumentTypes.length).toBeGreaterThan(0);
    expect(g!.guidingQuestion.toLowerCase()).toContain("debe");
    expect(g!.clausesToInspect.length).toBe(g!.priorityCategories.length);
  });

  it("todas las guías evaluables tienen categorías prioritarias", () => {
    for (const g of getAllReadingGuides()) {
      expect(g.priorityCategories.length).toBeGreaterThan(0);
    }
  });

  it("no existe para un id de navegación/inexistente", () => {
    expect(getReadingGuide("provider_comparison")).toBeNull();
    expect(getReadingGuide("nope")).toBeNull();
  });
});

describe("getDocumentsForReadingGuide / prioritizeDocumentsForReading", () => {
  const guide = getReadingGuide("personal_data")!;
  // personal_data priorityCategories: privacy, training_use, data_retention, data_deletion, security, jurisdiction
  const rich = mk("rich", { privacy: cat("found"), training_use: cat("found"), data_retention: cat("found"), security: cat("found") });
  const some = mk("some", { privacy: cat("found") });
  const none = mk("none", { commercial_use: cat("found") });

  it("ordena por prioridad de lectura (qué leer primero), no por riesgo", () => {
    const docs = getDocumentsForReadingGuide(guide, [some, rich, none]);
    // 'none' (sin categorías del escenario) se excluye; 'rich' (≥3 con evidencia) va primero.
    expect(docs.map((d) => d.analysisId)).toEqual(["rich", "some"]);
    expect(docs[0].readingPriority).toBe("high");
    expect(docs[1].readingPriority).toBe("medium");
    expect(docs.find((d) => d.analysisId === "none")).toBeUndefined();
  });

  it("prioritizeDocumentsForReading es consistente", () => {
    expect(prioritizeDocumentsForReading(guide, [rich, some]).length).toBe(2);
  });

  it("cada documento dice qué cláusulas contiene (whyRead)", () => {
    const docs = getDocumentsForReadingGuide(guide, [rich]);
    expect(docs[0].whyRead.length).toBeGreaterThan(0);
  });
});

describe("getClausesForReadingGuide", () => {
  it("lista, por cláusula, los documentos con evidencia", () => {
    const guide = getReadingGuide("personal_data")!;
    const a = mk("a", { privacy: cat("found", 2) });
    const clauses = getClausesForReadingGuide(guide, [a]);
    const privacy = clauses.find((c) => c.key === "privacy")!;
    expect(privacy.documentsWithEvidence.length).toBe(1);
    expect(privacy.documentsWithEvidence[0].analysisId).toBe("a");
  });
});
