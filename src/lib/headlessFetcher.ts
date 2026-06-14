/**
 * Fetcher headless para fuentes que bloquean un GET simple (p. ej. Cloudflare /
 * SPAs). Renderiza la página con un navegador headless real y devuelve el HTML
 * ya renderizado, con la MISMA forma que `fetchUrl`, para reusar el pipeline.
 *
 * Implementación: delega en el binario `browse` de gstack (navegador Chromium
 * headless ya instalado). NO hace spoofing agresivo: usa un navegador real.
 * Si el binario no está disponible, degrada con un error claro.
 *
 * Seguridad: solo se extrae TEXTO/HTML para parsear; nunca se ejecuta ni se
 * renderiza el contenido externo dentro de la UI.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { FetchResult } from "./fetcher";

const execFileAsync = promisify(execFile);

export const HEADLESS_FETCHER_VERSION = "0.1.0";

/** Ubica el binario `browse` de gstack (proyecto o global del usuario). */
export function resolveBrowseBin(): string | null {
  const candidates = [
    path.join(process.cwd(), ".claude/skills/gstack/browse/dist/browse"),
    path.join(os.homedir(), ".claude/skills/gstack/browse/dist/browse"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

/** Quita los marcadores de "contenido externo no confiable" que agrega browse. */
function stripUntrustedMarkers(out: string): string {
  return out
    .split("\n")
    .filter((line) => !/UNTRUSTED EXTERNAL CONTENT/.test(line))
    .join("\n")
    .trim();
}

const NAV_TIMEOUT_MS = 30_000;
const MAX_POLLS = 8;
const POLL_DELAY_MS = 2500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Heurística: ¿el HTML es una pantalla de desafío/espera (Cloudflare, etc.)? */
function looksLikeChallenge(html: string): boolean {
  return /just a moment|verifying you are human|checking your browser|waiting for [\w.-]+ to respond|verification successful|enable javascript and cookies|cf-browser-verification|challenge-platform|cf_chl|attention required/i.test(
    html,
  );
}

/** Cierra el daemon de browse (para cambiar entre headless/headed). */
export async function disconnectBrowser(): Promise<void> {
  const bin = resolveBrowseBin();
  if (!bin) return;
  try {
    await execFileAsync(bin, ["disconnect"], { timeout: 15_000 });
  } catch {
    // no había daemon, o ya estaba cerrado: no es error.
  }
}

/**
 * Renderiza `url` en el navegador (headless por defecto; `headed` usa un
 * Chromium real visible, que Cloudflare suele dejar pasar automáticamente).
 * Hace polling hasta que el contenido real aparece, o agota los intentos.
 */
export async function fetchUrlHeadless(url: string, opts: { headed?: boolean } = {}): Promise<FetchResult> {
  const bin = resolveBrowseBin();
  if (!bin) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: null,
      body: Buffer.alloc(0),
      error: "navegador (gstack browse) no disponible",
    };
  }

  const headed = opts.headed ?? false;
  const run = (args: string[]) =>
    execFileAsync(bin, args, { timeout: NAV_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 });
  // En headed, el flag `--headed` aplica al iniciar el daemon; se pasa en el goto.
  const gotoArgs = headed ? ["--headed", "goto", url] : ["goto", url];
  const polls = headed ? 14 : MAX_POLLS;

  try {
    await run(gotoArgs);
    // Una sola espera a red inactiva tras navegar (las siguientes iteraciones
    // solo releen el HTML con una pausa corta, mucho más barato).
    await run(["wait", "--networkidle"]).catch(() => undefined);

    let html = "";
    for (let i = 0; i < polls; i++) {
      const r = await run(["html"]).catch(() => ({ stdout: "" }) as { stdout: string });
      html = stripUntrustedMarkers(r.stdout);
      // Contenido sustancial y que NO parece pantalla de desafío -> listo.
      if (html.length > 3000 && !looksLikeChallenge(html)) break;
      await sleep(POLL_DELAY_MS);
    }

    const finalUrl = await run(["url"])
      .then((r) => r.stdout.trim())
      .catch(() => url);

    const stillChallenge = looksLikeChallenge(html);
    const ok = html.length > 200 && !stillChallenge;

    return {
      ok,
      status: ok ? 200 : 0,
      finalUrl: finalUrl || url,
      contentType: "text/html",
      body: Buffer.from(html, "utf8"),
      error: ok
        ? undefined
        : stillChallenge
          ? "el navegador headless no pudo superar la pantalla de verificación (Cloudflare)"
          : "render headless vacío o demasiado corto",
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: null,
      body: Buffer.alloc(0),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
