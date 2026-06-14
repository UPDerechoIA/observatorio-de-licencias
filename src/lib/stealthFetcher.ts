/**
 * Fetcher STEALTH (evasión anti-bot, autorizado explícitamente).
 *
 * Usa Playwright + plugin stealth para renderizar como un navegador real y
 * superar protecciones tipo Cloudflare que bloquean GET/headless. Persiste la
 * cookie de clearance entre llamadas (userDataDir estable) para ser rápido.
 *
 * AVISO: cruza el límite de "sin scraping agresivo". Está aislado en su propio
 * módulo, con import dinámico para no entrar en el bundle de la app web.
 */

import os from "node:os";
import path from "node:path";
import type { FetchResult } from "./fetcher";

export const STEALTH_FETCHER_VERSION = "0.1.0";

const USER_DATA_DIR = path.join(os.tmpdir(), "uplaw-stealth-profile");
const NAV_TIMEOUT_MS = 50_000;
const MAX_POLLS = 16;
const POLL_DELAY_MS = 2500;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function looksLikeChallenge(s: string): boolean {
  return /just a moment|verify you are human|verifying you are human|attention required|enable javascript and cookies|checking your browser|performing security verification|waiting for [\w.-]+ to respond|security service to protect against malicious bots/i.test(
    s,
  );
}

async function pollForContent(page: {
  title: () => Promise<string>;
  evaluate: (fn: () => string) => Promise<string>;
  waitForTimeout: (ms: number) => Promise<void>;
}): Promise<{ title: string; txt: string; ok: boolean }> {
  let title = "";
  let txt = "";
  for (let i = 0; i < MAX_POLLS; i++) {
    title = await page.title().catch(() => "");
    txt = await page.evaluate(() => (document.body ? document.body.innerText : "")).catch(() => "");
    if (txt.length > 1500 && !looksLikeChallenge(`${title} ${txt}`)) return { title, txt, ok: true };
    await page.waitForTimeout(POLL_DELAY_MS);
  }
  return { title, txt, ok: false };
}

export async function fetchUrlStealth(url: string): Promise<FetchResult> {
  let chromium: typeof import("playwright-extra").chromium;
  let stealth: () => unknown;
  try {
    // Import dinámico: mantiene Playwright fuera del bundle de la app web.
    ({ chromium } = await import("playwright-extra"));
    stealth = (await import("puppeteer-extra-plugin-stealth")).default as () => unknown;
    chromium.use(stealth() as Parameters<typeof chromium.use>[0]);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: null,
      body: Buffer.alloc(0),
      error: `stealth no disponible (instalá playwright-extra): ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let ctx: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null = null;
  try {
    ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: true,
      viewport: { width: 1280, height: 900 },
      userAgent: UA,
      locale: "en-US",
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS }).catch(() => undefined);

    let poll = await pollForContent(page);
    // Algunos Cloudflare re-desafían tras "Verification successful": recargar
    // con la clearance ya seteada suele aterrizar en el documento real.
    if (!poll.ok) {
      await page.reload({ waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS }).catch(() => undefined);
      poll = await pollForContent(page);
    }

    const html = await page.content();
    const finalUrl = page.url();
    const ok = html.length > 2000 && !looksLikeChallenge(poll.txt);

    return {
      ok,
      status: ok ? 200 : 0,
      finalUrl: finalUrl || url,
      contentType: "text/html",
      body: Buffer.from(html, "utf8"),
      error: ok ? undefined : "stealth no obtuvo contenido legible (¿desafío persistente?)",
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
    await ctx?.close().catch(() => undefined);
  }
}
