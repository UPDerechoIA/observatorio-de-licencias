import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import {
  saveRawText,
  loadRawText,
  saveLicenseAnalysis,
  loadLicenseAnalysis,
  loadAllLicenseAnalyses,
  licenseExists,
  licenseJsonPath,
} from "../src/lib/storage";
import { parseLicense } from "../src/lib/parser";
import { rawTextRelativePath } from "../src/lib/storage";
import path from "node:path";

// id que ordena al final y es claramente de test; se limpia tras cada caso.
const TEST_ID = "zzz-storage-roundtrip-test-2026-06-14";

async function cleanup() {
  await fs.rm(licenseJsonPath(TEST_ID), { force: true });
  await fs.rm(path.join(process.cwd(), "data", "raw", `${TEST_ID}.txt`), { force: true });
}

afterEach(cleanup);

describe("storage (round-trip real)", () => {
  it("guarda y lee el texto original", async () => {
    const rel = await saveRawText(TEST_ID, "[MOCK CLAUSE] texto de prueba.");
    expect(rel).toBe(rawTextRelativePath(TEST_ID));
    expect(await loadRawText(TEST_ID)).toContain("texto de prueba");
  });

  it("persiste, valida y vuelve a leer un análisis", async () => {
    const analysis = parseLicense({
      id: TEST_ID,
      providerName: "RoundTrip",
      productName: "Prod",
      productTier: "Free",
      documentType: "Terms of Use",
      sourceUrl: null,
      retrievedAt: "2026-06-14",
      rawTextPath: rawTextRelativePath(TEST_ID),
      rawText: "[MOCK CLAUSE] We may modify these terms and we retain your data.",
      isMock: true,
    });

    expect(await licenseExists(TEST_ID)).toBe(false);
    await saveLicenseAnalysis(analysis);
    expect(await licenseExists(TEST_ID)).toBe(true);

    const loaded = await loadLicenseAnalysis(TEST_ID);
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(TEST_ID);
    expect(loaded).toEqual(analysis);

    const all = await loadAllLicenseAnalyses();
    expect(all.some((a) => a.id === TEST_ID)).toBe(true);
  });

  it("loadLicenseAnalysis devuelve null si no existe", async () => {
    expect(await loadLicenseAnalysis("no-existe-jamas")).toBeNull();
  });
});
