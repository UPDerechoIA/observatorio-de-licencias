/**
 * Fetcher mínimo y prudente para descargar SOLO URLs explícitas del registro.
 *
 * NO hace crawling, NO sigue links del contenido, NO ejecuta nada. Solo un GET
 * con timeout, User-Agent descriptivo, límite de tamaño y seguimiento de
 * redirecciones (las que hace `fetch` por defecto).
 */

export const FETCHER_VERSION = "0.1.0";

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const USER_AGENT =
  "UP-Law-AILO/0.1 (legal-document observatory; non-commercial research; contact: local)";

export interface FetchResult {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string | null;
  body: Buffer;
  error?: string;
}

export async function fetchUrl(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain,application/pdf;q=0.9,*/*;q=0.5",
        "Accept-Language": "en,es;q=0.8",
      },
    });

    // Lee con tope de tamaño para que una redirección a un binario grande no
    // cuelgue ni infle memoria.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.byteLength;
          if (total > MAX_BYTES) {
            await reader.cancel();
            break;
          }
          chunks.push(value);
        }
      }
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url || url,
      contentType: res.headers.get("content-type"),
      body,
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
  } finally {
    clearTimeout(timer);
  }
}
