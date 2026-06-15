# Memo de resolución de fuentes — UP-Law-AILO

Fecha: 2026-06-15. Método: navegador headless (gstack) sobre dominios oficiales, con `?hl=en` para
evitar contenido geolocalizado en español. Sin fuentes de terceros, sin inventar URLs ni conclusiones.

Los paquetes jurídicos viven en `data/coverage/*.json` (validados por Zod). Los documentos base se
**referencian** a los análisis canónicos existentes; no se duplican.

---

## 1. Gmail (Google) — `partially_resolved`

Gmail **no** se cierra como "lo cubren los Términos generales de Google". Su régimen es un paquete.

**Fuentes oficiales revisadas**
- `policies.google.com/terms` (Términos base de Google) — **aceptada como base**.
- `policies.google.com/privacy` (Privacidad base de Google) — **aceptada como base**.
- `policies.google.com/terms/service-specific` — confirma que Google mantiene términos específicos por
  servicio y **lista "Gmail" y "Google Workspace"**.
- `transparency.google/our-policies/product-terms/gmail/` (Gmail Policies/Program Policies) — **aceptada
  como documento específico de producto**.
- `workspace.google.com/terms/premier_terms/` (Google Workspace Terms) — **aceptada como términos de
  modalidad** (business/enterprise/education).

**Documentos base referenciados** (no duplicados)
- Google Terms of Service → análisis canónico `google-gemini-terms-of-service-2026-06-14` (mismo URL).
  Evidencia oficial: *"…to use Gmail, you need a Google Account so that you have a place to send and
  receive your email."* (Google ToS).
- Google Privacy Policy → análisis canónico `google-gemini-privacy-policy-2026-06-14`.

**Documentos específicos encontrados**
- Gmail Program Policies (Transparency Center): página oficial **propia de Gmail**. Es mayormente
  índice/enlaces, por lo que se registra en el paquete (`verified_product_specific`) **sin** generar un
  análisis léxico de una página índice (evita un análisis hueco).

**Documentos por modalidad**
- Google Workspace Terms → aplica a Gmail bajo cuentas de trabajo/escuela/organización
  (`business`, `enterprise`, `education`). Documento real y sustantivo (~73k chars) pero geolocalizado en
  español; se registra como fuente, **sin** análisis léxico (el parser es de palabras clave en inglés).
  **No se traslada a Gmail gratuito.**

**Pendientes**
- Política de privacidad independiente de Gmail: `not_found_after_official_search` — Gmail remite a la
  Política de Privacidad general de Google.
- Términos de funciones de IA en Gmail (Gemini in Gmail): `not_found_after_official_search` en esta pasada.

**Decisión final**: Gmail queda como **paquete parcialmente resuelto**, con base referenciada + documento
específico + términos de modalidad + pendientes explícitos. No se cierra con un ToS genérico.

**Fuentes descartadas**: ninguna de terceros considerada. Solo dominios oficiales de Google
(`policies.google.com`, `transparency.google`, `workspace.google.com`).

---

## 2. Android (Google) — `partially_resolved`

**Fuentes oficiales revisadas**
- `policies.google.com/terms` y `/privacy` — base referenciada.
- `play.google.com/about/play-terms/` (Google Play ToS, ~27k chars) — **documento específico de producto**.

**Decisión final**: paquete con base de Google + Términos de Google Play. **Sin** un ToS independiente del
sistema operativo Android distinto de los Términos de Google (`unclear_scope`). Google Play Services / GMS y
términos de dispositivo quedan como pendientes (`not_found_after_official_search` / `unclear_scope`). Los
documentos de Play/Workspace vinieron geolocalizados en español; se registran como fuente, sin análisis léxico.

---

## 3. Apple Privacy Policy — pendiente técnico

**Estrategias intentadas**: GET simple (≈645 chars → `unsupported_format`); navegador headless sobre
`apple.com/legal/privacy/` y la variante regional `apple.com/legal/privacy/en-ww/`.

**Resultado**: la variante en-ww rinde ~3168 chars que son **mayormente la navegación global del sitio de
Apple** más una introducción ("Apple's Privacy Policy describes how Apple collects, uses, and shares your
personal data… Updated July 30, 2025"). El cuerpo de la política (recopilación, uso, compartición,
retención, derechos en detalle) **no renderiza**: carga diferida por JavaScript.

**Causa de falla**: SPA con contenido diferido; el extractor no obtiene el cuerpo sustantivo. **No** se
genera análisis para no fabricar contenido.

**Resuelto en su lugar**: Apple Media Services Terms sí se ingirió (~53k chars) como análisis canónico
`apple-apple-ios-media-services-terms-2026-06-15`.

**Pendiente técnico (TODO)**: extraer la Política de Privacidad de Apple con espera de render / lectura del
payload oficial embebido. Ver `TODO.md`.
