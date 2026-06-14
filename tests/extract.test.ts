import { describe, it, expect } from "vitest";
import {
  htmlToText,
  detectFormat,
  assessContentValidity,
  extractText,
  detectCanonicalUrl,
} from "../src/lib/extract";

const LEGAL_HTML = `<!DOCTYPE html><html><head><title>Terms</title>
<link rel="canonical" href="https://example.com/terms"/>
<style>.x{color:red}</style><script>alert('x')</script></head>
<body><nav>menu links here</nav>
<h1>Terms of Service</h1>
<p>These terms govern your use of the service. By accessing it you agree to the privacy policy.</p>
<p>Limitation of liability: in no event shall the provider be liable for damages. The agreement is governed by applicable law and jurisdiction.</p>
<p>We process personal information and describe data retention. Intellectual property and license terms apply. Arbitration may apply.</p>
<footer>copyright</footer></body></html>`;

describe("detectFormat", () => {
  it("detecta PDF por magic bytes", () => {
    expect(detectFormat(null, Buffer.from("%PDF-1.7\n..."))).toBe("pdf");
  });
  it("detecta HTML por content-type", () => {
    expect(detectFormat("text/html; charset=utf-8", Buffer.from("<x>"))).toBe("html");
  });
  it("detecta texto plano", () => {
    expect(detectFormat("text/plain", Buffer.from("hola"))).toBe("text");
  });
});

describe("htmlToText", () => {
  const text = htmlToText(LEGAL_HTML);
  it("elimina script y style", () => {
    expect(text).not.toContain("alert");
    expect(text).not.toContain("color:red");
  });
  it("conserva el texto legal", () => {
    expect(text).toContain("Terms of Service");
    expect(text).toContain("Limitation of liability");
  });
});

describe("detectCanonicalUrl", () => {
  it("extrae la URL canónica", () => {
    expect(detectCanonicalUrl(LEGAL_HTML)).toBe("https://example.com/terms");
  });
});

describe("assessContentValidity (puerta de contenido)", () => {
  it("acepta un documento legal real", () => {
    const v = assessContentValidity(htmlToText(LEGAL_HTML) + " ".repeat(800));
    expect(v.ok).toBe(true);
  });
  it("rechaza un cascarón corto (SPA / soft-404)", () => {
    const v = assessContentValidity("<div id=root></div> Loading…");
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/corto/);
  });
  it("rechaza texto largo sin marcadores legales", () => {
    const v = assessContentValidity("lorem ipsum ".repeat(200));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/marcadores/);
  });
});

describe("extractText", () => {
  it("PDF -> método none, inválido", () => {
    const r = extractText("pdf", Buffer.from("%PDF"));
    expect(r.method).toBe("none");
    expect(r.validity.ok).toBe(false);
  });
});
