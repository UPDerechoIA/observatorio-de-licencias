/**
 * ingest:stealth — reintenta fuentes BLOQUEADAS con un navegador STEALTH.
 *
 * EVASIÓN ANTI-BOT AUTORIZADA EXPLÍCITAMENTE. Cruza el límite de "sin scraping
 * agresivo": usa Playwright + plugin stealth para superar Cloudflare. Solo
 * apunta a documentos `failed_fetch` (403/429/503) o `unavailable`, y verifica
 * que el host final pertenezca al dominio oficial.
 *
 * Uso:
 *   npm run ingest:stealth
 *   npm run ingest:stealth -- --provider openai
 */

import { parseArgs } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadRegistry, saveRegistry, flattenDocuments } from "../src/lib/sources";
import { ingestDocument, ensureDataDirs } from "../src/lib/ingest";
import { LOGS_DIR } from "../src/lib/paths";

const { values } = parseArgs({
  options: { provider: { type: "string" }, limit: { type: "string" } },
});

const RETRY_STATUSES = new Set(["failed_fetch", "unavailable"]);
const BLOCK_HTTP = new Set([403, 429, 503, 0]);

async function main() {
  await ensureDataDirs();
  const registry = await loadRegistry();
  let docs = flattenDocuments(registry, values.provider);

  let targets = docs.filter(
    (d) =>
      d.document.sourceUrl &&
      RETRY_STATUSES.has(d.document.sourceStatus) &&
      (d.document.httpStatus === null || BLOCK_HTTP.has(d.document.httpStatus)),
  );
  const limit = values.limit ? parseInt(values.limit, 10) : undefined;
  if (limit) targets = targets.slice(0, limit);

  if (targets.length === 0) {
    console.log("No hay fuentes bloqueadas para reintentar con stealth.");
    return;
  }

  console.log(`⚠ Modo STEALTH (evasión autorizada). Reintentando ${targets.length} fuente(s)…\n`);

  const results = [];
  for (const flat of targets) {
    const result = await ingestDocument(flat, { stealth: true });
    results.push({ provider: flat.provider.providerId, ...result });

    flat.document.sourceStatus = result.status;
    flat.document.lastCheckedAt = new Date().toISOString();
    if (result.httpStatus !== null) flat.document.httpStatus = result.httpStatus;
    if (result.finalUrl) flat.document.finalUrl = result.finalUrl;
    if (result.wrote) flat.document.notes = "Obtenido con navegador stealth (evasión autorizada); contenido del dominio oficial.";

    const mark = result.wrote ? "✓" : result.skipped ? "=" : "✗";
    console.log(`  ${mark} ${flat.provider.providerId}/${flat.document.documentId} -> ${result.status}: ${result.reason}`);
  }

  await saveRegistry(registry);

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(LOGS_DIR, `ingest-stealth-${ts}.json`);
  await fs.writeFile(logPath, JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2) + "\n", "utf8");

  const wrote = results.filter((r) => r.wrote).length;
  console.log(`\nResumen: ${wrote} escritos de ${results.length} reintentos.`);
  console.log(`Log: ${path.relative(process.cwd(), logPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
