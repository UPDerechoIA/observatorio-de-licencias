/**
 * validate:data — valida todos los JSON de data/licenses contra el schema Zod,
 * y el registro de proveedores. Sale con código 1 si algo no valida.
 *
 * Uso:  npm run validate:data
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { LICENSES_DIR, PROVIDERS_JSON } from "../src/lib/paths";
import { LicenseAnalysisSchema } from "../src/lib/schema";
import { ProviderRegistrySchema } from "../src/lib/sources";

async function main() {
  let failures = 0;
  let ok = 0;

  // 1) Registro de proveedores
  try {
    ProviderRegistrySchema.parse(JSON.parse(await fs.readFile(PROVIDERS_JSON, "utf8")));
    console.log("✓ data/sources/providers.json válido");
  } catch (err) {
    failures++;
    console.error("✗ data/sources/providers.json inválido:", err);
  }

  // 2) Análisis
  let files: string[] = [];
  try {
    files = (await fs.readdir(LICENSES_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    console.log("No existe data/licenses todavía.");
  }

  for (const file of files) {
    const raw = await fs.readFile(path.join(LICENSES_DIR, file), "utf8");
    const result = LicenseAnalysisSchema.safeParse(JSON.parse(raw));
    if (result.success) {
      ok++;
    } else {
      failures++;
      console.error(`✗ ${file}:`, result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
  }

  console.log(`\n${ok} análisis válidos, ${failures} con errores.`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
