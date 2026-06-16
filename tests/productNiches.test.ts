import { describe, it, expect } from "vitest";
import {
  PRODUCT_NICHE_VALUES,
  PRODUCT_NICHE_LIST,
  ProductNicheSchema,
  productNicheInfo,
  productNicheLabel,
} from "../src/domain/taxonomies/productNiches";
import { loadRegistry } from "../src/lib/sources";

describe("taxonomía de nichos de producto", () => {
  it("cada nicho tiene label, descripción clara y lectura jurídica", () => {
    for (const info of PRODUCT_NICHE_LIST) {
      expect(PRODUCT_NICHE_VALUES).toContain(info.id);
      expect(info.label.length, info.id).toBeGreaterThan(2);
      expect(info.plainDescription.length, info.id).toBeGreaterThan(20);
      expect(info.legalReadingHint.length, info.id).toBeGreaterThan(20);
      // El label nunca debe ser el id crudo.
      expect(info.label).not.toBe(info.id);
    }
  });

  it("incluye los nichos pedidos", () => {
    for (const id of [
      "general_llm",
      "video_generation",
      "image_generation",
      "audio_voice_generation",
      "coding_assistant",
      "search_answer_engine",
      "office_productivity",
      "social_platform",
      "mobile_ecosystem",
      "model_platform",
      "cloud_ai_platform",
    ]) {
      expect(PRODUCT_NICHE_VALUES).toContain(id);
    }
  });

  it("productNicheLabel nunca devuelve el id técnico crudo", () => {
    expect(productNicheLabel("general_llm")).toBe("LLM general");
    expect(productNicheLabel("video_generation")).toBe("Video generativo");
    expect(productNicheLabel("office_productivity")).toBe("Productividad / oficina");
    expect(productNicheInfo("desconocido_xyz").id).toBe("unknown");
  });

  it("todo producto del registro tiene un nicho válido de la taxonomía", async () => {
    const reg = await loadRegistry();
    for (const p of reg.providers) {
      for (const prod of p.products) {
        expect(ProductNicheSchema.safeParse(prod.productNiche).success, `${p.providerId}/${prod.productId}=${prod.productNiche}`).toBe(true);
      }
    }
  });

  it("clasifica ejemplos clave según la consigna", async () => {
    const reg = await loadRegistry();
    const niche = (provId: string, prodId: string) =>
      reg.providers.find((p) => p.providerId === provId)?.products.find((pr) => pr.productId === prodId)?.productNiche;
    expect(niche("runway", "runway")).toBe("video_generation");
    expect(niche("elevenlabs", "elevenlabs")).toBe("audio_voice_generation");
    expect(niche("github", "copilot")).toBe("coding_assistant");
    expect(niche("perplexity", "perplexity-ai")).toBe("search_answer_engine");
    expect(niche("huggingface", "hub")).toBe("model_platform");
    expect(niche("aws", "bedrock")).toBe("cloud_ai_platform");
    expect(niche("google", "gmail")).toBe("office_productivity");
    expect(niche("x", "x")).toBe("social_platform");
    expect(niche("apple", "apple-ios")).toBe("mobile_ecosystem");
  });
});
