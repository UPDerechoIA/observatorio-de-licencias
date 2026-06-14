/**
 * Persistencia en disco. El filesystem es la fuente de verdad del MVP.
 *
 *   data/licenses/<id>.json  -> análisis estructurado y validado (Zod).
 *   data/raw/<id>.txt        -> texto original del documento.
 *
 * Este módulo es "server-only": solo debe importarse desde el servidor
 * (server components, server actions). No usa base de datos.
 */

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { LicenseAnalysisSchema, type LicenseAnalysis } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
export const LICENSES_DIR = path.join(DATA_DIR, "licenses");
export const RAW_DIR = path.join(DATA_DIR, "raw");

async function ensureDirs(): Promise<void> {
  await fs.mkdir(LICENSES_DIR, { recursive: true });
  await fs.mkdir(RAW_DIR, { recursive: true });
}

export function licenseJsonPath(id: string): string {
  return path.join(LICENSES_DIR, `${id}.json`);
}

export function rawTextRelativePath(id: string): string {
  // Ruta relativa al root del proyecto, tal como se guarda en el JSON.
  return path.posix.join("data", "raw", `${id}.txt`);
}

function rawTextAbsolutePath(id: string): string {
  return path.join(RAW_DIR, `${id}.txt`);
}

/** Guarda el texto original como .txt y devuelve su ruta relativa. */
export async function saveRawText(id: string, rawText: string): Promise<string> {
  await ensureDirs();
  await fs.writeFile(rawTextAbsolutePath(id), rawText, "utf8");
  return rawTextRelativePath(id);
}

/** Lee el texto original asociado a un análisis (o null si no existe). */
export async function loadRawText(id: string): Promise<string | null> {
  try {
    return await fs.readFile(rawTextAbsolutePath(id), "utf8");
  } catch {
    return null;
  }
}

/** Valida y guarda el análisis como JSON indentado. */
export async function saveLicenseAnalysis(analysis: LicenseAnalysis): Promise<string> {
  await ensureDirs();
  const validated = LicenseAnalysisSchema.parse(analysis);
  const filePath = licenseJsonPath(validated.id);
  await fs.writeFile(filePath, JSON.stringify(validated, null, 2) + "\n", "utf8");
  return filePath;
}

/** ¿Existe ya un análisis con este id? */
export async function licenseExists(id: string): Promise<boolean> {
  try {
    await fs.access(licenseJsonPath(id));
    return true;
  } catch {
    return false;
  }
}

/** Carga y valida un análisis por id. Devuelve null si no existe o no valida. */
export async function loadLicenseAnalysis(id: string): Promise<LicenseAnalysis | null> {
  try {
    const raw = await fs.readFile(licenseJsonPath(id), "utf8");
    return LicenseAnalysisSchema.parse(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`[storage] No se pudo leer/validar ${id}.json:`, err);
    }
    return null;
  }
}

/**
 * Lee el texto (extraído o crudo) asociado a un análisis, a partir de su
 * `rawTextPath`. Por seguridad solo permite rutas dentro de `data/`.
 * Devuelve SIEMPRE texto plano: nunca se interpreta como HTML.
 */
export async function loadAnalysisText(analysis: LicenseAnalysis): Promise<string | null> {
  const rel = analysis.rawTextPath;
  const abs = path.resolve(DATA_DIR, path.relative("data", rel));
  if (!abs.startsWith(DATA_DIR)) return null; // anti path-traversal
  try {
    return await fs.readFile(abs, "utf8");
  } catch {
    return null;
  }
}

/**
 * Carga y valida todos los análisis de data/licenses. Los archivos que no
 * validan se omiten con un warning (no rompen la vista).
 */
export async function loadAllLicenseAnalyses(): Promise<LicenseAnalysis[]> {
  await ensureDirs();
  const files = await fs.readdir(LICENSES_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const results = await Promise.all(
    jsonFiles.map(async (file) => {
      const full = path.join(LICENSES_DIR, file);
      try {
        const raw = await fs.readFile(full, "utf8");
        return LicenseAnalysisSchema.parse(JSON.parse(raw));
      } catch (err) {
        console.warn(`[storage] Se omite ${file} (JSON inválido o no valida el schema):`, err);
        return null;
      }
    }),
  );

  return results
    .filter((x): x is LicenseAnalysis => x !== null)
    .sort((a, b) => a.providerName.localeCompare(b.providerName) || a.productName.localeCompare(b.productName));
}
