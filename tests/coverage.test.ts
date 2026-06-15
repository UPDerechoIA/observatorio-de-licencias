import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadAllLegalBundles, LegalBundleSchema } from "../src/lib/coverage";

async function bundles() {
  return loadAllLegalBundles();
}

describe("paquetes jurídicos (data/coverage)", () => {
  it("todos los bundles validan contra el schema y se cargan", async () => {
    const dir = path.join(process.cwd(), "data", "coverage");
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const raw = JSON.parse(await fs.readFile(path.join(dir, f), "utf8"));
      expect(LegalBundleSchema.safeParse(raw).success).toBe(true);
    }
    const loaded = await loadAllLegalBundles();
    expect(loaded.length).toBe(files.length);
  });

  it("Gmail existe como paquete y NO se cierra como términos generales", async () => {
    const gmail = (await bundles()).find((b) => b.productName === "Gmail");
    expect(gmail).toBeTruthy();
    // No existe un estado 'covered_by_general_terms'; debe ser parcialmente resuelto.
    expect(gmail!.bundleStatus).toBe("partially_resolved");
    const roles = gmail!.documents.map((d) => d.documentRole);
    // Distingue documentos base y documentos específicos del producto.
    expect(roles).toContain("base_terms");
    expect(roles).toContain("program_policy");
    expect(roles).toContain("workspace_terms");
  });

  it("Gmail referencia los documentos base de Google por id canónico, no los duplica", async () => {
    const gmail = (await bundles()).find((b) => b.productName === "Gmail")!;
    const base = gmail.documents.find((d) => d.documentRole === "base_terms")!;
    expect(base.status).toBe("referenced_canonical_document");
    expect(base.canonicalAnalysisId).toBe("google-gemini-terms-of-service-2026-06-14");
    expect(base.evidenceQuote.toLowerCase()).toContain("gmail");
  });

  it("Gmail distingue modalidad: Workspace aplica a business/enterprise/education, no a free", async () => {
    const gmail = (await bundles()).find((b) => b.productName === "Gmail")!;
    const ws = gmail.documents.find((d) => d.documentRole === "workspace_terms")!;
    expect(ws.appliesToModes).toEqual(expect.arrayContaining(["business", "enterprise", "education"]));
    expect(ws.appliesToModes).not.toContain("free");
  });

  it("Gmail registra pendientes con estado preciso (not_found_after_official_search)", async () => {
    const gmail = (await bundles()).find((b) => b.productName === "Gmail")!;
    expect(gmail.unresolved.length).toBeGreaterThan(0);
    expect(gmail.unresolved.some((u) => u.status === "not_found_after_official_search")).toBe(true);
  });

  it("Android existe como paquete (no solo Google Terms)", async () => {
    const android = (await bundles()).find((b) => b.productName === "Android")!;
    expect(android).toBeTruthy();
    expect(android.documents.some((d) => d.documentRole === "product_terms")).toBe(true);
  });

  it("Apple Privacy queda como pendiente técnico (unsupported_format), sin análisis fabricado", async () => {
    const apple = (await bundles()).find((b) => b.productName.startsWith("Apple"))!;
    const priv = apple.documents.find((d) => d.documentType === "Apple Privacy Policy")!;
    expect(priv.status).toBe("unsupported_format");
    expect(priv.canonicalAnalysisId).toBeNull();
    // No debe existir un análisis de privacidad de Apple en data/licenses.
    const licenses = await fs.readdir(path.join(process.cwd(), "data", "licenses"));
    expect(licenses.some((f) => f.includes("apple") && f.includes("privacy"))).toBe(false);
  });
});
