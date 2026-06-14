import { describe, it, expect } from "vitest";
import { parseLicense, type ParseLicenseParams } from "../src/lib/parser";
import {
  computeMetrics,
  filterAnalyses,
  topRiskCategories,
  riskRationale,
  providerSummaries,
  EMPTY_FILTERS,
} from "../src/lib/derive";
import { MODE_LABELS, ALL_MODE_EXPLANATION } from "../src/lib/contractingModes";
import { CATEGORY_BY_KEY } from "../src/lib/categories";

const base: Omit<ParseLicenseParams, "rawText" | "documentType" | "contractingMode" | "sourceScope" | "providerName" | "productName" | "id"> = {
  productTier: "All",
  sourceUrl: null,
  retrievedAt: "2026-06-14",
  rawTextPath: "data/extracted/x.txt",
};

const labelOf = (k: string) => CATEGORY_BY_KEY[k]?.label ?? k;

function mk(over: Partial<ParseLicenseParams> & { rawText: string }) {
  return parseLicense({
    id: over.id ?? "id-" + Math.random().toString(36).slice(2),
    providerName: over.providerName ?? "Prov",
    productName: over.productName ?? "Prod",
    documentType: over.documentType ?? "Terms of Service",
    contractingMode: over.contractingMode ?? "all",
    sourceScope: over.sourceScope ?? "general",
    ...base,
    ...over,
  });
}

const highRisk = "Limitation of liability and binding arbitration apply. You will indemnify us. Personal data is processed.";
const lowish = "These terms describe general informational use. Personal data is processed.";

describe("computeMetrics", () => {
  it("cuenta totales, proveedores, modalidades y pendientes", () => {
    const a = [
      mk({ providerName: "A", contractingMode: "all", rawText: highRisk }),
      mk({ providerName: "B", contractingMode: "enterprise", documentType: "Enterprise Terms", sourceScope: "mode_specific", rawText: highRisk }),
    ];
    const m = computeMetrics(a, ["verified", "verified", "needs_manual_review"]);
    expect(m.total).toBe(2);
    expect(m.providers).toBe(2);
    expect(m.modesDetected).toBe(2);
    expect(m.pendingSources).toBe(1);
    expect(m.mockDocs).toBe(0);
  });
});

describe("filterAnalyses", () => {
  const data = [
    mk({ providerName: "Anthropic", productName: "Claude", contractingMode: "enterprise", documentType: "Enterprise Terms", sourceScope: "mode_specific", rawText: highRisk }),
    mk({ providerName: "OpenAI", productName: "ChatGPT", contractingMode: "all", documentType: "Privacy Policy", rawText: lowish }),
  ];
  it("filtra por modalidad", () => {
    expect(filterAnalyses(data, { ...EMPTY_FILTERS, modality: "enterprise" })).toHaveLength(1);
  });
  it("filtra por riesgo", () => {
    const high = filterAnalyses(data, { ...EMPTY_FILTERS, risk: "high" });
    expect(high.every((a) => a.overall.overallRiskLevel === "high")).toBe(true);
  });
  it("filtra por privacidad", () => {
    const r = filterAnalyses(data, { ...EMPTY_FILTERS, privacy: "unknown" });
    expect(r.every((a) => a.privacy.posture === "unknown")).toBe(true);
  });
  it("busca por proveedor/producto/documento", () => {
    expect(filterAnalyses(data, { ...EMPTY_FILTERS, search: "anthropic" })).toHaveLength(1);
    expect(filterAnalyses(data, { ...EMPTY_FILTERS, search: "privacy" })).toHaveLength(1);
  });
  it("filtra por revisión y fuente", () => {
    data[0].metadata.reviewStatus = "reviewed";
    data[0].metadata.sourceVerified = true;
    expect(filterAnalyses(data, { ...EMPTY_FILTERS, review: "reviewed" })).toHaveLength(1);
    expect(filterAnalyses(data, { ...EMPTY_FILTERS, source: "verified" })).toHaveLength(1);
  });
});

describe("fundamento de riesgo (derivado, no inventado)", () => {
  it("topRiskCategories es subconjunto de las categorías detectadas high/medium", () => {
    const a = mk({ rawText: highRisk });
    for (const d of topRiskCategories(a, labelOf)) {
      const c = a.categories[d.key];
      expect(c.status).toBe("found");
      expect(["high", "medium"]).toContain(c.riskLevel);
    }
  });
  it("riesgo desconocido => fundamento de revisión manual", () => {
    const a = mk({ rawText: "texto trivial sin cláusulas" });
    expect(a.overall.overallRiskLevel).toBe("unknown");
    expect(riskRationale(a, labelOf)).toMatch(/evidencia suficiente|ambigua/i);
  });
});

describe("modalidad 'all' siempre con explicación", () => {
  it("MODE_LABELS.all es 'Aplicación general' y hay texto explicativo", () => {
    expect(MODE_LABELS.all).toBe("Aplicación general");
    expect(ALL_MODE_EXPLANATION.length).toBeGreaterThan(10);
  });
});

describe("providerSummaries", () => {
  it("agrupa por proveedor y resume", () => {
    const s = providerSummaries([
      mk({ providerName: "X", productName: "P1", rawText: highRisk }),
      mk({ providerName: "X", productName: "P2", rawText: lowish }),
      mk({ providerName: "Y", productName: "Q", rawText: lowish }),
    ]);
    const x = s.find((p) => p.providerName === "X")!;
    expect(x.docCount).toBe(2);
    expect(x.products.sort()).toEqual(["P1", "P2"]);
  });
});
