/**
 * ingest:manual — ingiere un documento desde un archivo LOCAL (texto o HTML).
 *
 * Para fuentes que un GET/headless no puede bajar (p. ej. OpenAI tras Cloudflare)
 * pero que sí podés ver en tu navegador: guardás la página (o copiás el texto) a
 * un archivo y lo cargás con este comando. Pasa por el MISMO pipeline
 * (extracción → puerta de validez → parser con modalidad/privacidad).
 *
 * Queda marcado honestamente: `sourceVerified: false`, `sourceStatus:
 * "needs_manual_review"`, `extractionMethod: "manual"|"html-to-text"`.
 *
 * Uso:
 *   npm run ingest:manual -- \
 *     --provider "OpenAI" --product "ChatGPT" --mode all \
 *     --doc-type "Terms of Use" --file ./openai-terms.txt \
 *     --url https://openai.com/policies/terms-of-use/
 */

import { parseArgs } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  extractedAbsPath,
  extractedRelPath,
  fetchedAbsPath,
  fetchedRelPath,
  licenseJsonPath,
  ALL_DATA_DIRS,
} from "../src/lib/paths";
import { buildDocumentId, slugify } from "../src/lib/id";
import { sha256 } from "../src/lib/hash";
import { detectFormat, extractText } from "../src/lib/extract";
import { parseLicense } from "../src/lib/parser";
import { LicenseAnalysisSchema, type SourceScope } from "../src/lib/schema";
import { isContractingMode, type ContractingMode } from "../src/lib/contractingModes";

const { values } = parseArgs({
  options: {
    provider: { type: "string" },
    product: { type: "string" },
    "doc-type": { type: "string" },
    mode: { type: "string" },
    file: { type: "string" },
    url: { type: "string" },
    "provider-id": { type: "string" },
    "product-id": { type: "string" },
    "document-id": { type: "string" },
  },
});

function req(name: string, v: string | undefined): string {
  if (!v) {
    console.error(`Falta --${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const providerName = req("provider", values.provider);
  const productName = req("product", values.product);
  const documentType = req("doc-type", values["doc-type"]);
  const file = req("file", values.file);
  const modeRaw = values.mode ?? "unknown";
  if (!isContractingMode(modeRaw)) {
    console.error(`--mode inválido: ${modeRaw}`);
    process.exit(1);
  }
  const mode = modeRaw as ContractingMode;

  await Promise.all(ALL_DATA_DIRS.map((d) => fs.mkdir(d, { recursive: true })));

  const providerId = values["provider-id"] ?? slugify(providerName);
  const productId = values["product-id"] ?? slugify(productName);
  const documentId = values["document-id"] ?? slugify(documentType);
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const id = buildDocumentId({ providerId, productId, documentId, datePart });

  const body = await fs.readFile(path.resolve(file));
  const format = detectFormat(null, body);
  const isHtml = format === "html";
  const extraction = extractText(isHtml ? "html" : "text", body);

  if (!extraction.validity.ok) {
    console.warn(`Aviso: la puerta de validez no pasó (${extraction.validity.reason}).`);
    console.warn("Si pegaste texto limpio, suele estar bien; si era una página parcial, revisá el archivo.");
  }

  if (isHtml) await fs.writeFile(fetchedAbsPath(id, "html"), body);
  await fs.writeFile(extractedAbsPath(id), extraction.text, "utf8");

  const retrievedAt = now.toISOString();
  const analysis = parseLicense({
    id,
    providerName,
    productName,
    productTier: "All",
    documentType,
    sourceUrl: values.url ?? null,
    retrievedAt,
    rawTextPath: extractedRelPath(id),
    rawText: extraction.text,
    isMock: false,
    contractingMode: mode,
    appliesToModes: mode === "all" || mode === "unknown" ? [] : [mode],
    sourceScope: (mode === "all" ? "general" : mode === "unknown" ? "unclear" : "mode_specific") as SourceScope,
  });

  const validated = LicenseAnalysisSchema.parse({
    ...analysis,
    metadata: {
      ...analysis.metadata,
      isMock: false,
      reviewStatus: "needs_legal_review",
      retrievedAt,
      fetcherVersion: "manual-0.1.0",
      contentHash: sha256(extraction.text),
      sourceVerified: false,
      sourceStatus: "needs_manual_review",
      extractionMethod: isHtml ? "html-to-text" : "manual",
      finalUrl: values.url ?? null,
      fetchedPath: isHtml ? fetchedRelPath(id, "html") : null,
      extractedTextPath: extractedRelPath(id),
      extractedChars: extraction.validity.chars,
      providerId,
      productId,
      documentId,
    },
  });

  await fs.writeFile(licenseJsonPath(id), JSON.stringify(validated, null, 2) + "\n", "utf8");
  console.log(`✓ Ingerido (manual): ${id}`);
  console.log(`  modalidad: ${mode} · privacidad: ${validated.privacy.posture} · ${extraction.validity.chars} chars`);
  console.log(`  ${path.relative(process.cwd(), licenseJsonPath(id))}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
