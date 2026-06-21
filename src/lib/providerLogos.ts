/**
 * Resolución de logos de proveedor, static-export safe y sin servicios externos.
 *
 * El logo es local (`public/logos/<providerId>.svg`) o un campo `logoPath` del
 * registro; si no existe ninguno, la tarjeta cae a un monograma (ver
 * `ProviderLogo`). Para no emitir requests 404 cuando todavía no hay un logo, las
 * vistas (server components) consultan `availableProviderLogos()` y solo pasan
 * `src` cuando el archivo existe. Este módulo lee el filesystem: solo server.
 */

import fs from "node:fs/promises";
import path from "node:path";

export { resolveLogoSrc } from "./providerLogoUtils";

const LOGOS_DIR = path.join(process.cwd(), "public", "logos");
const LOGO_EXT = /\.(svg|png|webp)$/i;

/** Mapa providerId → ruta del logo (`logos/<id>.<ext>`) para los que existen. */
export async function availableProviderLogos(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const files = await fs.readdir(LOGOS_DIR);
    for (const f of files) {
      if (!LOGO_EXT.test(f)) continue;
      map.set(f.replace(LOGO_EXT, ""), `logos/${f}`);
    }
  } catch {
    // sin carpeta: todos caen a monograma.
  }
  return map;
}
