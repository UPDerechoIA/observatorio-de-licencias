# Política de Seguridad

## Versiones soportadas

`UP-Law-AILO` se encuentra actualmente en etapa de desarrollo MVP.

Los reportes de seguridad deben referirse a la versión más reciente disponible en la rama principal (`main`), salvo que exista una rama de release o una versión etiquetada mantenida expresamente.

| Versión          | Soportada                       |
| ---------------- | ------------------------------- |
| main             | Sí                              |
| ramas anteriores | No, salvo mantenimiento expreso |

## Reporte de vulnerabilidades

Si descubrís una vulnerabilidad de seguridad, por favor reportala de manera responsable.

Para problemas sensibles de seguridad, **no abras un issue público en GitHub**. En su lugar, contactá al mantenedor de forma privada:

**[gbarosio@gmail.com](mailto:gbarosio@gmail.com)**

Cuando sea posible, incluí:

* una descripción clara de la vulnerabilidad;
* archivos, rutas, comandos o componentes afectados;
* pasos para reproducir el problema;
* impacto potencial;
* si el problema expone datos de usuario, archivos locales, credenciales, documentos fuente o análisis JSON generados;
* una sugerencia de remediación, si la tenés.

Si el problema **no es sensible** y no expone datos privados, credenciales, archivos locales ni comportamiento explotable, podés abrir un issue público en GitHub.

Ejemplos de problemas no sensibles:

* errores de documentación;
* advertencias de seguridad poco claras;
* bugs de validación no explotables;
* problemas de UI relacionados con indicadores de seguridad;
* solicitudes de mejora en la documentación de seguridad.

## Alcance

Las siguientes áreas se consideran relevantes desde el punto de vista de seguridad:

* acceso al sistema de archivos, especialmente a `data/`;
* ingesta de documentos legales externos;
* HTML, texto o documentos descargados;
* archivos JSON de análisis generados;
* manejo de URLs fuente;
* manejo de paths y generación de nombres de archivo;
* renderizado de texto extraído;
* validación de schemas JSON;
* prevención de inyección de HTML o scripts desde documentos descargados;
* configuración local de desarrollo;
* vulnerabilidades en dependencias.

## Fuera de alcance

En general, se consideran fuera de alcance, salvo que generen un impacto de seguridad demostrable:

* problemas puramente visuales de UI;
* vulnerabilidades teóricas sin camino claro de reproducción;
* problemas que requieran acceso físico a la máquina del desarrollador;
* problemas causados por modificaciones locales inseguras ajenas al proyecto;
* vulnerabilidades en servicios de terceros no controlados por este repositorio;
* desacuerdos jurídicos sobre la interpretación de términos, licencias o políticas de proveedores.

## Principios de seguridad

`UP-Law-AILO` está diseñado como un observatorio legal local basado en archivos. En su MVP, el proyecto no utiliza base de datos, autenticación, acceso multiusuario ni APIs externas de LLM.

Los principios de seguridad relevantes son:

* no ejecutar contenido descargado;
* no renderizar HTML descargado como HTML confiable;
* tratar todos los documentos externos como entrada no confiable;
* validar los JSON generados antes de utilizarlos;
* mantener la evidencia trazable al texto fuente;
* no almacenar secretos en el repositorio;
* no hardcodear credenciales;
* evitar construcción insegura de paths;
* evitar sobrescrituras silenciosas de documentos fuente o análisis;
* preservar URLs fuente, hashes y fechas de recuperación para auditabilidad.

## Manejo de documentos externos

Los documentos ingeridos desde sitios de proveedores deben tratarse como contenido no confiable.

La aplicación debe:

* guardar el contenido descargado como dato, no como código ejecutable;
* extraer y mostrar texto de forma segura;
* evitar inyectar HTML externo en la UI;
* sanitizar o escapar contenido antes de renderizarlo;
* preservar metadata de fuente, incluyendo URL, fecha de recuperación y hash;
* evitar seguir enlaces arbitrarios salvo que estén expresamente configurados.

## Proceso de divulgación

Luego de recibir un reporte privado, el mantenedor intentará:

1. acusar recibo del reporte;
2. evaluar severidad y reproducibilidad;
3. determinar si el problema debe permanecer privado durante la remediación;
4. preparar y probar una corrección cuando corresponda;
5. publicar una actualización o aviso de seguridad si fuera necesario.

Durante la etapa MVP no se garantiza un tiempo específico de respuesta. Sin embargo, se priorizarán problemas graves que involucren exposición de datos, ejecución de código, path traversal, filtración de credenciales o renderizado inseguro.

## Issues públicos

Usá issues públicos de GitHub solo para reportes que no sean sensibles.

No publiques públicamente:

* vulnerabilidades explotables;
* pruebas de concepto que permitan abuso;
* rutas privadas de archivos de otra persona;
* secretos, credenciales, tokens o API keys;
* vulnerabilidades que permitan lectura o escritura arbitraria de archivos;
* vulnerabilidades que permitan ejecución de scripts o inyección de contenido.

## Ausencia de garantía legal o de seguridad

`UP-Law-AILO` es un MVP orientado a observación documental, trazabilidad y análisis preliminar de documentos legales. No es un producto de seguridad y no ofrece garantías legales, regulatorias, de cumplimiento ni de seguridad.

El uso del proyecto es bajo responsabilidad de cada usuario.
