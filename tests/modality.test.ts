import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseLicense, type ParseLicenseParams } from "../src/lib/parser";
import { LicenseAnalysisSchema } from "../src/lib/schema";
import { ProviderRegistrySchema, flattenDocuments } from "../src/lib/sources";

const base: Omit<ParseLicenseParams, "rawText" | "documentType" | "contractingMode" | "sourceScope"> = {
  id: "x-y-z-2026-06-14",
  providerName: "X",
  productName: "Y",
  productTier: "All",
  sourceUrl: null,
  retrievedAt: "2026-06-14",
  rawTextPath: "data/extracted/x.txt",
};

describe("modalidad de contratación", () => {
  it("documento enterprise por título -> mode_specific, confianza alta", () => {
    const a = parseLicense({
      ...base,
      documentType: "Enterprise Terms",
      contractingMode: "enterprise",
      appliesToModes: ["enterprise"],
      sourceScope: "mode_specific",
      rawText: "These Enterprise Terms govern enterprise accounts. Privacy and liability apply. Personal data is processed.",
    });
    expect(a.contractingMode).toBe("enterprise");
    expect(a.sourceScope).toBe("mode_specific");
    expect(a.modeConfidence).toBe("high");
    expect(a.appliesToModes).toContain("enterprise");
  });

  it("documento general que diferencia modalidades -> mixed", () => {
    const a = parseLicense({
      ...base,
      documentType: "Terms of Service",
      contractingMode: "all",
      appliesToModes: ["free", "paid_individual", "enterprise"],
      sourceScope: "general",
      rawText:
        "Free plan users: content may be used to improve the service. Enterprise customers receive additional protections. The api terms differ. Personal data is processed.",
    });
    expect(a.sourceScope).toBe("mixed");
    expect(a.modeRationale.length).toBeGreaterThan(10);
  });

  it("documento general sin diferenciación -> general, confianza alta, con fundamento", () => {
    const a = parseLicense({
      ...base,
      documentType: "Terms of Service",
      contractingMode: "all",
      appliesToModes: ["free", "paid_individual"],
      sourceScope: "general",
      rawText: "These terms govern your use. Privacy, liability, governing law and arbitration apply. Personal data is processed.",
    });
    expect(a.sourceScope).toBe("general");
    expect(a.modeConfidence).toBe("high");
    expect(a.modeRationale).toMatch(/general/i);
  });

  it("anota categorías mode_specific cuando la evidencia menciona una modalidad", () => {
    const a = parseLicense({
      ...base,
      documentType: "Terms of Service",
      contractingMode: "all",
      appliesToModes: ["free"],
      sourceScope: "general",
      rawText: "For free plan accounts, we may use your content to train our models and improve our services.",
    });
    const t = a.categories.training_use;
    expect(t.status).toBe("found");
    expect(t.modeSpecificity).toBe("mode_specific");
    expect(t.appliesToModes).toContain("free");
  });
});

describe("perfil preliminar de privacidad", () => {
  const mk = (rawText: string) =>
    parseLicense({ ...base, documentType: "Privacy Policy", contractingMode: "all", sourceScope: "general", rawText });

  it("strong: compromiso de no entrenamiento + DPA/confidencialidad", () => {
    const a = mk(
      "Privacy policy. We process personal data. We will not use your content to train our models. We offer a data processing addendum. We keep your confidential information secret. We retain data for a period. You can delete your data.",
    );
    expect(a.privacy.posture).toBe("strong");
    expect(a.privacy.signals).toContain("no_training_commitment");
  });

  it("weak: uso amplio para entrenamiento + licencia amplia + eliminación poco clara", () => {
    const a = mk(
      "Privacy policy. We process personal data. We use your content to train our models and improve our services. You grant us a worldwide license to use your content.",
    );
    expect(a.privacy.posture).toBe("weak");
  });

  it("unknown: sin señales de privacidad", () => {
    const a = mk("These terms govern arbitration and limitation of liability only.");
    expect(a.privacy.posture).toBe("unknown");
  });

  it("NO marca no_training ante una restricción dirigida al usuario", () => {
    const a = mk("Privacy policy. We process personal data. You may not use the outputs to train competing models.");
    expect(a.privacy.signals).not.toContain("no_training_commitment");
  });

  it("riesgo general y privacidad son campos separados", () => {
    const a = mk("Privacy policy. We process personal data. Limitation of liability and binding arbitration apply.");
    expect(a.overall.overallRiskLevel).toBeDefined();
    expect(a.privacy.posture).toBeDefined();
  });
});

describe("schema y registro", () => {
  it("un análisis con campos de modalidad valida", () => {
    const a = parseLicense({
      ...base,
      documentType: "Terms of Service",
      contractingMode: "enterprise",
      appliesToModes: ["enterprise"],
      sourceScope: "mode_specific",
      rawText: "Enterprise terms. Personal data processed. Liability applies.",
    });
    expect(LicenseAnalysisSchema.safeParse(a).success).toBe(true);
  });

  it("en el registro, `all` no coexiste con mode_specific (y viceversa)", async () => {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "sources", "providers.json"), "utf8");
    const reg = ProviderRegistrySchema.parse(JSON.parse(raw));
    for (const { document } of flattenDocuments(reg)) {
      if (document.sourceScope === "mode_specific") expect(document.contractingMode).not.toBe("all");
      if (document.contractingMode === "all") expect(document.sourceScope).not.toBe("mode_specific");
    }
  });
});
