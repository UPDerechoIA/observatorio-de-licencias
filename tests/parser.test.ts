import { describe, it, expect } from "vitest";
import { parseLicense } from "../src/lib/parser";
import { LicenseAnalysisSchema } from "../src/lib/schema";
import { CATEGORY_KEYS } from "../src/lib/categories";

const baseParams = {
  id: "test-doc-2026-06-14",
  providerName: "TestProvider",
  productName: "TestProduct",
  productTier: "Free",
  documentType: "Terms of Use",
  sourceUrl: null,
  retrievedAt: "2026-06-14",
  rawTextPath: "data/raw/test-doc-2026-06-14.txt",
};

const richText = `
[MOCK CLAUSE] We may use your content to train our models and for model improvement.
[MOCK CLAUSE] Limitation of liability: in no event shall we be liable for damages.
[MOCK CLAUSE] These terms are governed by the laws of the State of California.
[MOCK CLAUSE] We may modify these terms at any time.
`;

describe("parseLicense", () => {
  it("produce un análisis que valida contra el schema", () => {
    const analysis = parseLicense({ ...baseParams, rawText: richText });
    expect(() => LicenseAnalysisSchema.parse(analysis)).not.toThrow();
  });

  it("incluye TODAS las categorías canónicas", () => {
    const analysis = parseLicense({ ...baseParams, rawText: richText });
    expect(Object.keys(analysis.categories).sort()).toEqual([...CATEGORY_KEYS].sort());
  });

  it("detecta uso para entrenamiento como 'found' con evidencia", () => {
    const analysis = parseLicense({ ...baseParams, rawText: richText });
    const training = analysis.categories.training_use;
    expect(training.status).toBe("found");
    expect(training.evidence.length).toBeGreaterThan(0);
    expect(training.riskLevel).toBe("high");
  });

  it("todo hallazgo 'found' tiene evidencia (consistencia)", () => {
    const analysis = parseLicense({ ...baseParams, rawText: richText });
    for (const finding of Object.values(analysis.categories)) {
      if (finding.status === "found") {
        expect(finding.evidence.length).toBeGreaterThan(0);
      }
    }
  });

  it("marca 'not_found' cuando no hay coincidencias", () => {
    const analysis = parseLicense({ ...baseParams, rawText: "Texto trivial sin cláusulas legales." });
    expect(analysis.categories.arbitration.status).toBe("not_found");
    expect(analysis.categories.arbitration.evidence).toHaveLength(0);
  });

  it("usa lenguaje prudente, no categórico", () => {
    const analysis = parseLicense({ ...baseParams, rawText: richText });
    const text = analysis.categories.liability_limitation.legalSummary.toLowerCase();
    expect(text).toMatch(/requeriría revisión legal humana|no surge con claridad|podría/);
  });

  it("la evidencia contiene contexto, no solo la palabra clave", () => {
    const analysis = parseLicense({ ...baseParams, rawText: richText });
    const ev = analysis.categories.training_use.evidence[0];
    expect(ev.quote.length).toBeGreaterThan("train our models".length);
    expect(ev.locationHint).toBeTruthy();
  });
});
