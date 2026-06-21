/**
 * Descarga los logos OFICIALES declarados en el registro a `public/logos/`.
 *
 * Mismo patrón honesto que la ingesta: escribe SOLO si la fuente es oficial y
 * responde una imagen. Para cada proveedor con `logo.downloadUrl`:
 *   (a) GET real siguiendo redirects;
 *   (b) status 2xx;
 *   (c) Content-Type de imagen (svg+xml | png | webp);
 *   (d) host FINAL ∈ `logo.officialHosts`.
 * Si no se cumplen, NO escribe (queda el monograma) y registra el motivo.
 * Los SVG se sanitizan (sin <script> ni atributos on*). No se recolorea nada.
 * Idempotente: sobrescribe el mismo archivo si vuelve a pasar las validaciones.
 *
 * Uso: node scripts/fetch-logos.mjs   (o: npm run logos:fetch)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "data", "sources", "providers.json");
const OUT_DIR = path.join(ROOT, "public", "logos");

const EXT_BY_TYPE = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Clave de archivo del logo = `providerKey` de la app (`slug(providerName)`),
 * para que coincida con cómo las vistas resuelven el proveedor. No usar el
 * `providerId` del registro: difiere del slug en algunos casos (aws vs
 * amazon-web-services, huggingface vs hugging-face, stability vs stability-ai).
 */
function logoKey(provider) {
  return provider.providerName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/** ¿El host final pertenece a alguno de los hosts oficiales (exacto o subdominio)? */
function hostAllowed(host, officialHosts) {
  if (!host) return false;
  return officialHosts.some((h) => {
    const d = h.toLowerCase();
    return host === d || host.endsWith(`.${d}`);
  });
}

/** Sanitiza SVG: elimina <script>…</script> y atributos on*="" (defensa básica). */
function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
}

async function main() {
  const registry = JSON.parse(await fs.readFile(REGISTRY, "utf8"));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const UA = "E-Law logo fetcher (academic, non-commercial; contact: local)";

  /** GET con reintento ante 429 (Wikimedia limita ráfagas): backoff creciente. */
  async function fetchWithRetry(url) {
    let res;
    for (let attempt = 0; attempt < 5; attempt++) {
      res = await fetch(url, { redirect: "follow", headers: { "user-agent": UA } });
      if (res.status !== 429) return res;
      await sleep(3000 * (attempt + 1)); // 3s, 6s, 9s, 12s
    }
    return res;
  }

  const results = [];
  for (const p of registry.providers) {
    const logo = p.logo;
    if (!logo?.downloadUrl) {
      results.push({ id: p.providerId, status: "sin-fuente" });
      continue;
    }
    // Cortesía con la fuente: un request por vez, pausado.
    await sleep(1200);
    try {
      const res = await fetchWithRetry(logo.downloadUrl);
      const finalHost = hostOf(res.url);
      const ctype = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const ext = EXT_BY_TYPE[ctype];

      if (!res.ok) { results.push({ id: p.providerId, status: "http-error", detail: `HTTP ${res.status}` }); continue; }
      if (!ext) { results.push({ id: p.providerId, status: "no-es-imagen", detail: ctype || "sin content-type" }); continue; }
      if (!hostAllowed(finalHost, logo.officialHosts || [])) {
        results.push({ id: p.providerId, status: "host-no-oficial", detail: `${finalHost} ∉ [${(logo.officialHosts || []).join(", ")}]` });
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const key = logoKey(p);
      // Limpiar otras extensiones previas del mismo proveedor (idempotencia).
      for (const e of ["svg", "png", "webp"]) {
        if (e !== ext) await fs.rm(path.join(OUT_DIR, `${key}.${e}`)).catch(() => {});
      }
      const outName = `${key}.${ext}`;
      const data = ext === "svg" ? Buffer.from(sanitizeSvg(buf.toString("utf8")), "utf8") : buf;
      await fs.writeFile(path.join(OUT_DIR, outName), data);
      results.push({ id: p.providerId, status: "ok", detail: `${outName} (${ctype}, ${data.length} B) ← ${finalHost}` });
    } catch (err) {
      results.push({ id: p.providerId, status: "error", detail: err instanceof Error ? err.message : String(err) });
    }
  }

  const icon = { ok: "✓", "sin-fuente": "·", "host-no-oficial": "✗", "no-es-imagen": "✗", "http-error": "✗", error: "✗" };
  for (const r of results) console.log(`${icon[r.status] ?? "?"} [${r.status.padEnd(15)}] ${r.id}${r.detail ? ` — ${r.detail}` : ""}`);
  const n = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nResumen: ${n("ok")} descargados · ${n("host-no-oficial")} host no oficial · ${n("no-es-imagen")} no-imagen · ${n("http-error") + n("error")} error · ${n("sin-fuente")} sin fuente`);
}

main().catch((e) => { console.error(e); process.exit(1); });
