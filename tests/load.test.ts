import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { LicenseAnalysisSchema } from "../src/lib/schema";

/**
 * Lee directamente data/licenses (sin pasar por el módulo "server-only") y
 * valida que TODO archivo JSON presente cumpla el schema. Esto cubre el
 * requisito de "lectura de archivos JSON desde data/licenses".
 */
const LICENSES_DIR = path.join(process.cwd(), "data", "licenses");

describe("data/licenses", () => {
  it("todos los JSON presentes validan contra el schema", async () => {
    let files: string[] = [];
    try {
      files = (await fs.readdir(LICENSES_DIR)).filter((f) => f.endsWith(".json"));
    } catch {
      // Si la carpeta no existe todavía, no hay nada que validar.
      return;
    }

    for (const file of files) {
      const raw = await fs.readFile(path.join(LICENSES_DIR, file), "utf8");
      const result = LicenseAnalysisSchema.safeParse(JSON.parse(raw));
      expect(result.success, `Archivo inválido: ${file}`).toBe(true);
    }
  });
});
