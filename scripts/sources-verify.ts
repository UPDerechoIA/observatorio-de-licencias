/**
 * sources:verify — verifica las URLs del registro de proveedores.
 *
 * Hace un GET real a cada URL explícita y SOLO marca `verified` si responde
 * 2xx Y el host final (tras redirecciones) pertenece a un dominio oficial del
 * proveedor. Reescribe data/sources/providers.json con el resultado.
 *
 * No descarga el documento completo para análisis: eso es tarea de la ingesta.
 *
 * Uso:
 *   npm run sources:verify
 *   npm run sources:verify -- --provider openai
 */

import { parseArgs } from "node:util";
import { loadRegistry, saveRegistry, flattenDocuments, hostMatchesDomains } from "../src/lib/sources";
import { fetchUrl } from "../src/lib/fetcher";
import type { SourceStatus } from "../src/lib/schema";

const { values } = parseArgs({ options: { provider: { type: "string" } } });

async function main() {
  const registry = await loadRegistry();
  const docs = flattenDocuments(registry, values.provider);
  if (docs.length === 0) {
    console.log("No hay documentos para verificar (¿proveedor inexistente?).");
    return;
  }

  const now = new Date().toISOString();
  const counts: Record<string, number> = {};

  for (const { provider, document } of docs) {
    document.lastCheckedAt = now;

    if (!document.sourceUrl) {
      document.sourceStatus = "needs_manual_review";
      tally(counts, document.sourceStatus);
      console.log(`  ~ ${provider.providerId}/${document.documentId}: sin URL -> needs_manual_review`);
      continue;
    }

    const res = await fetchUrl(document.sourceUrl, 20_000);
    document.httpStatus = res.status || null;
    document.finalUrl = res.finalUrl || null;

    let status: SourceStatus;
    if (res.status === 0) {
      status = "unavailable";
    } else if (!res.ok) {
      status = "failed_fetch";
    } else {
      let host = "";
      try {
        host = new URL(res.finalUrl).host;
      } catch {
        host = "";
      }
      status = hostMatchesDomains(host, provider.officialDomains) ? "verified" : "needs_manual_review";
      if (status === "needs_manual_review") {
        document.notes = `Redirección a dominio no oficial: ${host}`;
      }
    }

    document.sourceStatus = status;
    tally(counts, status);
    const mark = status === "verified" ? "✓" : status === "failed_fetch" || status === "unavailable" ? "✗" : "~";
    console.log(`  ${mark} ${provider.providerId}/${document.documentId}: HTTP ${res.status || "—"} -> ${status}`);
  }

  await saveRegistry(registry);

  console.log("\nResumen:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
  console.log(`\nRegistro actualizado: data/sources/providers.json`);
}

function tally(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
