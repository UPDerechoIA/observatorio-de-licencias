/**
 * Hash de contenido para trazabilidad. SHA-256 con prefijo `sha256:`.
 * Sin dependencias externas (usa el módulo `crypto` de Node).
 */

import { createHash } from "node:crypto";

export function sha256(content: string | Buffer | Uint8Array): string {
  const hash = createHash("sha256");
  hash.update(content);
  return `sha256:${hash.digest("hex")}`;
}
