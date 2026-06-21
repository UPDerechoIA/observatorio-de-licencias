# Logos de proveedores

Archivos `public/logos/<providerId>.<ext>` (svg/png/webp). El `providerId` es el id
del proveedor en `data/sources/providers.json`. Si no existe el archivo, la interfaz
muestra un **monograma** con las iniciales del proveedor.

## Cómo se obtienen

Se descargan con `npm run logos:fetch` (`scripts/fetch-logos.mjs`) desde la
`logo.downloadUrl` declarada por proveedor en el registro. Mismo patrón honesto que
la ingesta: el archivo se escribe **solo si** la respuesta es 2xx, el `Content-Type`
es imagen y el **host final** ∈ `logo.officialHosts`. Los SVG se **sanitizan** (sin
`<script>` ni atributos `on*`). **No se recolorea** nada: el logo va tal cual lo
exige la guía de marca. Sin requests externos en runtime: los archivos quedan
commiteados y el sitio los sirve offline.

La fuente, atribución y licencia de cada logo se conservan en el bloque `logo` del
proveedor en `data/sources/providers.json` (`sourceUrl`, `attribution`, `license`)
para trazabilidad.

## Aviso legal

Los logos son **marcas de sus respectivos titulares**. Se incluyen con fines de
**identificación nominativa** (referencia académica), conforme a la guía de marca de
cada proveedor, **sin implicar respaldo ni afiliación** y **sin recolorear**. Se
obtuvieron de fuentes oficiales (en esta versión, mayormente Wikimedia Commons, cuyo
host final es `upload.wikimedia.org`; ver la licencia de cada archivo en su página de
Commons). **No** están cubiertos por la licencia BSD del código de este repositorio
(igual que los contenidos de `data/`). Si sos titular de una marca y querés que se
retire o reemplace su logo, abrí un issue.
