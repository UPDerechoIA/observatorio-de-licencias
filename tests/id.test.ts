import { describe, it, expect } from "vitest";
import { buildAnalysisId, slugify, toDatePart } from "../src/lib/id";

describe("slugify", () => {
  it("normaliza acentos, mayúsculas y símbolos", () => {
    expect(slugify("OpenAI Términos de Uso!")).toBe("openai-terminos-de-uso");
  });
  it("colapsa guiones repetidos y recorta extremos", () => {
    expect(slugify("  --Plus / Pro--  ")).toBe("plus-pro");
  });
});

describe("toDatePart", () => {
  it("respeta YYYY-MM-DD", () => {
    expect(toDatePart("2026-06-14")).toBe("2026-06-14");
  });
  it("extrae la fecha de un ISO completo", () => {
    expect(toDatePart("2026-06-14T00:00:00.000Z")).toBe("2026-06-14");
  });
});

describe("buildAnalysisId", () => {
  const input = {
    providerName: "OpenAI",
    productName: "ChatGPT",
    productTier: "Plus",
    documentType: "Terms of Use",
    retrievedAt: "2026-06-14",
  };

  it("genera el id estable esperado", () => {
    expect(buildAnalysisId(input)).toBe("openai-chatgpt-plus-terms-of-use-2026-06-14");
  });

  it("es determinístico: mismas entradas, mismo id", () => {
    expect(buildAnalysisId(input)).toBe(buildAnalysisId({ ...input }));
  });
});
