/**
 * ingest — descarga y procesa documentos VERIFICADOS del registro.
 *
 * Solo procesa documentos con sourceStatus === "verified" (es decir, los que
 * pasaron sources:verify). Nunca ingiere URLs adivinadas o sin verificar.
 *
 * Uso:
 *   npm run ingest:provider -- --provider openai
 *   npm run ingest:all
 *   npm run ingest:all -- --limit 20
 */

import { parseArgs } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadRegistry, saveRegistry, flattenDocuments } from "../src/lib/sources";
import { ingestDocument, ensureDataDirs } from "../src/lib/ingest";
import { LOGS_DIR } from "../src/lib/paths";

const { values } = parseArgs({
  options: {
    provider: { type: "string" },
    all: { type: "boolean", default: false },
    limit: { type: "string" },
  },
});

async function main() {
  if (!values.provider && !values.all) {
    console.error("Indicá --provider <id> o --all.");
    process.exit(1);
  }

  await ensureDataDirs();
  const registry = await loadRegistry();
  let docs = flattenDocuments(registry, values.provider);

  // Solo se ingieren fuentes verificadas.
  const verified = docs.filter((d) => d.document.sourceStatus === "verified");
  const limit = values.limit ? parseInt(values.limit, 10) : undefined;
  const selected = limit ? verified.slice(0, limit) : verified;

  if (selected.length === 0) {
    console.log("No hay documentos 'verified' para ingerir.");
    console.log("Ejecutá primero:  npm run sources:verify");
    return;
  }

  console.log(`Ingiriendo ${selected.length} documento(s) verificado(s)…\n`);

  const results = [];
  for (const flat of selected) {
    const result = await ingestDocument(flat);
    results.push({ provider: flat.provider.providerId, ...result });

    // Refleja el resultado en el estado de la fuente (p. ej. degradar a failed_fetch).
    flat.document.sourceStatus = result.status;
    flat.document.lastCheckedAt = new Date().toISOString();
    if (result.httpStatus !== null) flat.document.httpStatus = result.httpStatus;
    if (result.finalUrl) flat.document.finalUrl = result.finalUrl;

    const mark = result.wrote ? "✓" : result.skipped ? "=" : "✗";
    console.log(`  ${mark} ${flat.provider.providerId}/${flat.document.documentId} -> ${result.status}: ${result.reason}`);
  }

  await saveRegistry(registry);

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(LOGS_DIR, `ingest-${ts}.json`);
  await fs.writeFile(logPath, JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2) + "\n", "utf8");

  const wrote = results.filter((r) => r.wrote).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.wrote && !r.skipped).length;
  console.log(`\nResumen: ${wrote} escritos, ${skipped} sin cambios, ${failed} no procesados.`);
  console.log(`Log: ${path.relative(process.cwd(), logPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
