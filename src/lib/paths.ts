/**
 * Rutas canónicas del almacenamiento en disco. La fuente de verdad es el
 * filesystem. Módulo "plano" (sin `server-only`) para poder usarse tanto desde
 * el servidor (storage.ts) como desde los scripts CLI de ingesta.
 *
 *   data/sources/providers.json   -> registro de proveedores y URLs oficiales
 *   data/fetched/<id>.<ext>       -> documento original descargado (html/pdf/txt)
 *   data/extracted/<id>.txt       -> texto plano extraído
 *   data/licenses/<id>.json       -> análisis estructurado (fuente de verdad de la app)
 *   data/raw/<id>.txt             -> texto de documentos cargados a mano / mock
 *   data/logs/                    -> logs de ingesta
 */

import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const SOURCES_DIR = path.join(DATA_DIR, "sources");
export const FETCHED_DIR = path.join(DATA_DIR, "fetched");
export const EXTRACTED_DIR = path.join(DATA_DIR, "extracted");
export const LICENSES_DIR = path.join(DATA_DIR, "licenses");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const LOGS_DIR = path.join(DATA_DIR, "logs");

export const PROVIDERS_JSON = path.join(SOURCES_DIR, "providers.json");

export const ALL_DATA_DIRS = [
  SOURCES_DIR,
  FETCHED_DIR,
  EXTRACTED_DIR,
  LICENSES_DIR,
  RAW_DIR,
  LOGS_DIR,
];

// --- rutas absolutas ---
export const licenseJsonPath = (id: string) => path.join(LICENSES_DIR, `${id}.json`);
export const rawTextAbsPath = (id: string) => path.join(RAW_DIR, `${id}.txt`);
export const fetchedAbsPath = (id: string, ext: string) => path.join(FETCHED_DIR, `${id}.${ext}`);
export const extractedAbsPath = (id: string) => path.join(EXTRACTED_DIR, `${id}.txt`);

// --- rutas relativas (las que se guardan dentro del JSON, estilo posix) ---
export const rawTextRelPath = (id: string) => path.posix.join("data", "raw", `${id}.txt`);
export const fetchedRelPath = (id: string, ext: string) => path.posix.join("data", "fetched", `${id}.${ext}`);
export const extractedRelPath = (id: string) => path.posix.join("data", "extracted", `${id}.txt`);
