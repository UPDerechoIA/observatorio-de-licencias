/**
 * Taxonomía central de NICHO funcional del producto.
 *
 * Cada nicho explica, en lenguaje claro para abogados, qué hace el producto y
 * qué conviene leer jurídicamente. Fuente única de verdad: `PRODUCT_NICHES`. De
 * ahí se derivan el tuple de valores, el schema Zod, el tipo y las etiquetas.
 *
 * No usar strings libres ni mostrar el id técnico crudo: usar `label`,
 * `plainDescription` y `legalReadingHint`.
 */

import { z } from "zod";

export interface ProductNicheInfo {
  id: ProductNiche;
  /** Nombre legible (nunca el id crudo). */
  label: string;
  /** Qué hace el producto, en lenguaje claro. */
  plainDescription: string;
  /** Qué debería mirar un abogado en este tipo de herramienta. */
  legalReadingHint: string;
}

// Tuple de ids (z.enum requiere literales). Fuente del tipo y la validación.
export const PRODUCT_NICHE_VALUES = [
  "general_llm",
  "video_generation",
  "image_generation",
  "audio_voice_generation",
  "coding_assistant",
  "search_answer_engine",
  "office_productivity",
  "social_platform",
  "mobile_ecosystem",
  "model_platform",
  "cloud_ai_platform",
  "unknown",
] as const;

export const ProductNicheSchema = z.enum(PRODUCT_NICHE_VALUES);
export type ProductNiche = z.infer<typeof ProductNicheSchema>;

export const PRODUCT_NICHES: Record<ProductNiche, ProductNicheInfo> = {
  general_llm: {
    id: "general_llm",
    label: "LLM general",
    plainDescription: "Asistente conversacional para redactar, resumir, analizar texto y responder preguntas.",
    legalReadingHint: "Revisar especialmente uso de prompts, outputs, entrenamiento, retención y confidencialidad.",
  },
  video_generation: {
    id: "video_generation",
    label: "Video generativo",
    plainDescription: "Herramienta para crear o editar videos mediante IA.",
    legalReadingHint: "Revisar derechos sobre imágenes, videos generados, material cargado y uso comercial.",
  },
  image_generation: {
    id: "image_generation",
    label: "Imagen generativa",
    plainDescription: "Herramienta para crear imágenes a partir de texto, imágenes o referencias visuales.",
    legalReadingHint: "Revisar propiedad intelectual del output, datasets, licencias y restricciones de uso.",
  },
  audio_voice_generation: {
    id: "audio_voice_generation",
    label: "Voz y audio",
    plainDescription: "Herramienta para generar, clonar, transformar o procesar voces y audio.",
    legalReadingHint: "Revisar consentimiento, derechos de imagen/voz, usos prohibidos y contenido sintético.",
  },
  coding_assistant: {
    id: "coding_assistant",
    label: "Asistente de programación",
    plainDescription: "Herramienta que ayuda a escribir, revisar o completar código.",
    legalReadingHint: "Revisar propiedad intelectual del código, confidencialidad del repositorio y uso de snippets.",
  },
  search_answer_engine: {
    id: "search_answer_engine",
    label: "Buscador con respuestas",
    plainDescription: "Herramienta que combina búsqueda web con respuestas generadas por IA.",
    legalReadingHint: "Revisar fuentes, responsabilidad por respuestas, privacidad de consultas y uso de datos.",
  },
  office_productivity: {
    id: "office_productivity",
    label: "Productividad / oficina",
    plainDescription: "Software de correo, documentos, planillas, presentaciones o colaboración profesional.",
    legalReadingHint: "Revisar privacidad, almacenamiento, retención, confidencialidad y términos de cuenta organizacional.",
  },
  social_platform: {
    id: "social_platform",
    label: "Red social",
    plainDescription: "Plataforma para publicar, compartir, interactuar y distribuir contenido.",
    legalReadingHint: "Revisar licencia sobre contenido publicado, moderación, privacidad y uso de datos.",
  },
  mobile_ecosystem: {
    id: "mobile_ecosystem",
    label: "Ecosistema móvil",
    plainDescription: "Sistema operativo, servicios o condiciones aplicables al uso de dispositivos móviles.",
    legalReadingHint: "Revisar recopilación de datos, cuenta, permisos, tienda de aplicaciones y privacidad.",
  },
  model_platform: {
    id: "model_platform",
    label: "Plataforma de modelos",
    plainDescription: "Repositorio, plataforma o infraestructura para publicar, alojar o usar modelos de IA.",
    legalReadingHint: "Revisar licencias de modelos, datasets, responsabilidad, uso comercial y restricciones.",
  },
  cloud_ai_platform: {
    id: "cloud_ai_platform",
    label: "Plataforma cloud de IA",
    plainDescription: "Servicio cloud para consumir, desplegar o integrar modelos de IA vía infraestructura empresarial.",
    legalReadingHint: "Revisar términos de API, procesamiento de datos, DPA, seguridad, retención y responsabilidad.",
  },
  unknown: {
    id: "unknown",
    label: "Nicho sin determinar",
    plainDescription: "Función del producto no clasificada todavía en el registro.",
    legalReadingHint: "Revisar el documento aplicable para entender el tipo de servicio y sus condiciones.",
  },
};

/** Lista ordenada (orden del tuple) para iterar en UI/documentación. */
export const PRODUCT_NICHE_LIST: ProductNicheInfo[] = PRODUCT_NICHE_VALUES.map((id) => PRODUCT_NICHES[id]);

export function productNicheInfo(niche: string): ProductNicheInfo {
  return PRODUCT_NICHES[niche as ProductNiche] ?? PRODUCT_NICHES.unknown;
}

export function productNicheLabel(niche: string): string {
  return productNicheInfo(niche).label;
}
