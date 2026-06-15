/**
 * Análisis mínimo de DIRECCIÓN jurídica de una cláusula.
 *
 * El parser determinístico clasifica por palabras clave. Sin mirar el sujeto,
 * confunde dos cosas opuestas:
 *   - un USO de datos por parte del PROVEEDOR ("we may use your content to train
 *     our models"), y
 *   - una RESTRICCIÓN impuesta al USUARIO ("you may not use outputs to train a
 *     model").
 *
 * `classifyClause` decide la dirección por SUJETO gramatical primero (quién hace
 * la acción), y solo después usa el modal para refinar entre obligación y
 * prohibición. Así "we do not sell your personal information" queda como política
 * de privacidad del proveedor, y "you may not violate privacy rights" como uso
 * prohibido del usuario.
 */

import type { ClauseActor, ClauseFunction, ObligationTarget } from "./schema";

export interface ClauseDirection {
  actor: ClauseActor;
  obligationTarget: ObligationTarget;
  clauseFunction: ClauseFunction;
}

// Sujeto-usuario en NOMINATIVO (agente que realiza la acción). Deliberadamente no
// incluye el posesivo "your", que casi siempre es OBJETO ("your content"), no agente.
const USER_AGENT =
  "(?:you|the user|users?|customers?|licensees?|recipients?|subscribers?|members?|end[- ]?users?)";
const PROVIDER_AGENT =
  "(?:we|us|our|the (?:company|provider|service|services|platform|site|application|app|website|licensor))";
const PROHIBITION =
  "(?:may not|shall not|must not|cannot|can[''’]?t|are not permitted(?: to)?|is not permitted(?: to)?|not permitted to|not allowed to|agree not to|agrees not to|agree that you will not|prohibited from|restricted from|refrain from|will not|won[''’]?t)";

// Usuario + prohibición ligada a ese sujeto (subject-first).
const RE_USER_PROHIBITION = new RegExp(`\\b${USER_AGENT}\\b[^.!?]{0,40}\\b${PROHIBITION}\\b`, "i");
// Usuario + obligación NO prohibitiva ("you must", "you are responsible for").
const RE_USER_OBLIGATION = new RegExp(
  `\\b${USER_AGENT}\\b[^.!?]{0,30}\\b(?:must|shall|agree to|are responsible for|is responsible for|will be responsible|are required to)\\b`,
  "i",
);

// Proveedor + verbo de tratamiento + datos personales / del usuario.
const RE_PROVIDER_PRIVACY = new RegExp(
  `\\b${PROVIDER_AGENT}\\b[^.!?]{0,60}\\b(?:collect|collects|use|uses|using|process|processes|share|shares|disclose|discloses|sell|sells|retain|retains|store|stores|transfer|transfers|access|protect|protects)\\b[^.!?]{0,60}\\b(?:personal (?:data|information)|your (?:data|information|personal)|user (?:data|information)|information (?:we collect|about you))\\b`,
  "i",
);
// Proveedor + uso de datos/contenido PARA entrenar o mejorar modelos.
const RE_PROVIDER_TRAINING = new RegExp(
  `\\b${PROVIDER_AGENT}\\b[^.!?]{0,80}\\bto (?:train|improve|develop|fine[- ]?tune)\\b[^.!?]{0,40}\\b(?:models?|ai|systems?|services?)\\b`,
  "i",
);
const RE_PROVIDER_TRAINING2 = new RegExp(
  `\\b${PROVIDER_AGENT}\\b[^.!?]{0,80}\\b(?:use|uses|using|process|processes|may use)\\b[^.!?]{0,60}\\b(?:to train|for training|to improve (?:our|the) (?:models?|ai|service))\\b`,
  "i",
);

const RE_IP_LICENSE = /\b(?:you grant|grant (?:us|to us)|grant (?:a|an)\b[^.!?]{0,25}\blicense|license to (?:use|reproduce|distribute))\b/i;

/**
 * Clasifica la dirección de una cláusula (a nivel de oración). Sesgo
 * conservador: ante la duda devuelve "unclear".
 */
export function classifyClause(sentence: string): ClauseDirection {
  // 1) Prohibición dirigida al usuario (sujeto-usuario + modal de prohibición).
  if (RE_USER_PROHIBITION.test(sentence)) {
    return { actor: "user", obligationTarget: "user", clauseFunction: "prohibited_use" };
  }
  // 2) Tratamiento de datos personales por el proveedor (incluye "we do not …").
  if (RE_PROVIDER_PRIVACY.test(sentence)) {
    return { actor: "provider", obligationTarget: "provider", clauseFunction: "privacy_policy" };
  }
  // 3) Uso de datos/contenido por el proveedor para entrenar o mejorar modelos.
  if (RE_PROVIDER_TRAINING.test(sentence) || RE_PROVIDER_TRAINING2.test(sentence)) {
    return { actor: "provider", obligationTarget: "provider", clauseFunction: "provider_data_use" };
  }
  // 4) Licencia de PI (el usuario concede derechos sobre su contenido).
  if (RE_IP_LICENSE.test(sentence)) {
    const actor: ClauseActor = /\byou grant\b/i.test(sentence) ? "user" : "unclear";
    return { actor, obligationTarget: "user", clauseFunction: "ip_license" };
  }
  // 5) Obligación (no prohibitiva) a cargo del usuario.
  if (RE_USER_OBLIGATION.test(sentence)) {
    return { actor: "user", obligationTarget: "user", clauseFunction: "user_restriction" };
  }
  return { actor: "unclear", obligationTarget: "unclear", clauseFunction: "unclear" };
}

/** Divide texto en oraciones, también cortando por saltos de línea. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
