import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { colorFor, initials, resolveLogoSrc } from "../src/lib/providerLogoUtils";
import { BASE_PATH } from "../src/lib/basePath";
import { ProviderRegistrySchema } from "../src/lib/sources";

describe("colorFor (monograma determinístico)", () => {
  it("es determinístico por id", () => {
    expect(colorFor("openai")).toBe(colorFor("openai"));
  });
  it("siempre devuelve un color de la paleta", () => {
    const palette = ["#334155", "#475569", "#1e3a5f", "#3f3f46", "#0f766e", "#7c2d12"];
    for (const id of ["openai", "anthropic", "google", "x", "amazon-web-services"]) {
      expect(palette).toContain(colorFor(id));
    }
  });
});

describe("initials", () => {
  it("toma la inicial de las dos primeras palabras", () => {
    expect(initials("Hugging Face")).toBe("HF");
    expect(initials("Amazon Web Services")).toBe("AW");
  });
  it("para un solo nombre usa su inicial", () => {
    expect(initials("Anthropic")).toBe("A");
  });
});

describe("resolveLogoSrc", () => {
  it("sin logoPath y sin archivo disponible → undefined (monograma)", () => {
    expect(resolveLogoSrc("openai", new Map(), undefined)).toBeUndefined();
  });
  it("con archivo disponible → ruta (con extensión real) y basePath", () => {
    const src = resolveLogoSrc("openai", new Map([["openai", "logos/openai.svg"]]), undefined);
    expect(src).toBe(`${BASE_PATH}/logos/openai.svg`);
  });
  it("respeta la extensión real del archivo (png/webp)", () => {
    const src = resolveLogoSrc("meta", new Map([["meta", "logos/meta.png"]]), undefined);
    expect(src).toBe(`${BASE_PATH}/logos/meta.png`);
  });
  it("logoPath explícito del registro tiene prioridad", () => {
    const src = resolveLogoSrc("openai", new Map(), "logos/custom-openai.svg");
    expect(src).toBe(`${BASE_PATH}/logos/custom-openai.svg`);
  });
});

describe("registro: bloque logo opcional (Zod)", () => {
  it("valida sin bloque logo (compat con datos previos)", () => {
    const reg = { version: "1", providers: [{ providerId: "x", providerName: "X", officialDomains: [], products: [] }] };
    expect(() => ProviderRegistrySchema.parse(reg)).not.toThrow();
  });
  it("valida con bloque logo", () => {
    const reg = {
      version: "1",
      providers: [{
        providerId: "openai", providerName: "OpenAI", officialDomains: ["openai.com"], products: [],
        logo: { sourceUrl: "https://openai.com/brand", downloadUrl: "https://upload.wikimedia.org/x.svg",
                officialHosts: ["upload.wikimedia.org"], attribution: "Logo de OpenAI", license: "trademark" },
      }],
    };
    const parsed = ProviderRegistrySchema.parse(reg);
    expect(parsed.providers[0].logo?.downloadUrl).toContain("upload.wikimedia.org");
  });
});

describe("public/logos: cada archivo corresponde a un proveedor del registro", () => {
  it("no hay logos huérfanos", () => {
    const dir = path.join(process.cwd(), "public", "logos");
    const reg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "sources", "providers.json"), "utf8"));
    // La app resuelve el logo por providerKey = slug(providerName); el registro
    // usa ids cortos. Aceptamos ambos para no quedar atados a una sola convención.
    const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const keys = new Set<string>();
    for (const p of reg.providers as { providerId: string; providerName: string }[]) {
      keys.add(p.providerId);
      keys.add(slug(p.providerName));
    }
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(svg|png|webp)$/i.test(f)) : [];
    for (const f of files) {
      const id = f.replace(/\.(svg|png|webp)$/i, "");
      expect(keys.has(id), `logo huérfano: ${f}`).toBe(true);
    }
  });
});
