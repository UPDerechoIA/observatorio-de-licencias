import { describe, it, expect } from "vitest";
import { sha256 } from "../src/lib/hash";
import { buildDocumentId } from "../src/lib/id";
import { parseLicense } from "../src/lib/parser";
import { LicenseAnalysisSchema, type LicenseAnalysis } from "../src/lib/schema";

describe("sha256", () => {
  it("es determinístico y con prefijo sha256:", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
    expect(sha256("hello")).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(sha256("a")).not.toBe(sha256("b"));
  });
});

describe("buildDocumentId", () => {
  it("genera id estable de ingesta", () => {
    expect(
      buildDocumentId({ providerId: "openai", productId: "chatgpt", documentId: "terms-of-use", datePart: "2026-06-14" }),
    ).toBe("openai-chatgpt-terms-of-use-2026-06-14");
  });
});

describe("schema con metadatos de ingesta real", () => {
  it("acepta un análisis real con isMock:false y metadata de ingesta", () => {
    const analysis = parseLicense({
      id: "openai-chatgpt-terms-of-use-2026-06-14",
      providerName: "OpenAI",
      productName: "ChatGPT",
      productTier: "All",
      documentType: "Terms of Use",
      sourceUrl: "https://openai.com/policies/terms-of-use/",
      retrievedAt: "2026-06-14T00:00:00.000Z",
      rawTextPath: "data/extracted/openai-chatgpt-terms-of-use-2026-06-14.txt",
      rawText: "These terms of service govern your use. Privacy, liability, governing law and arbitration apply.",
      isMock: false,
    });

    const real: LicenseAnalysis = {
      ...analysis,
      metadata: {
        ...analysis.metadata,
        isMock: false,
        sourceVerified: true,
        sourceStatus: "verified",
        contentHash: sha256("body"),
        fetcherVersion: "0.1.0",
        extractionMethod: "html-to-text",
        finalUrl: "https://openai.com/policies/terms-of-use/",
        canonicalUrl: null,
        fetchedPath: "data/fetched/openai-chatgpt-terms-of-use-2026-06-14.html",
        extractedTextPath: "data/extracted/openai-chatgpt-terms-of-use-2026-06-14.txt",
        extractedChars: 1234,
        retrievedAt: "2026-06-14T00:00:00.000Z",
      },
    };

    const parsed = LicenseAnalysisSchema.safeParse(real);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.metadata.isMock).toBe(false);
  });

  it("rechaza un sourceStatus inválido en metadata", () => {
    const analysis = parseLicense({
      id: "x", providerName: "X", productName: "Y", productTier: "All",
      documentType: "Terms", sourceUrl: null, retrievedAt: "2026-06-14",
      rawTextPath: "data/raw/x.txt", rawText: "terms privacy liability law", isMock: false,
    });
    const bad = { ...analysis, metadata: { ...analysis.metadata, sourceStatus: "totally-bogus" } };
    expect(LicenseAnalysisSchema.safeParse(bad).success).toBe(false);
  });
});
