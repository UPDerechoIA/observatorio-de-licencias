"use server";

/**
 * Server action de carga. Recibe los datos del formulario, valida, guarda el
 * texto original, ejecuta el parser determinístico, valida y persiste el JSON,
 * y redirige al análisis creado. No hay base de datos de por medio.
 */

import { redirect } from "next/navigation";
import { AnalysisInputSchema } from "@/lib/schema";
import { buildAnalysisId } from "@/lib/id";
import { parseLicense } from "@/lib/parser";
import { saveLicenseAnalysis, saveRawText, rawTextRelativePath } from "@/lib/storage";

export interface CreateAnalysisState {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function createAnalysisAction(
  _prevState: CreateAnalysisState,
  formData: FormData,
): Promise<CreateAnalysisState> {
  const raw = {
    providerName: String(formData.get("providerName") ?? ""),
    productName: String(formData.get("productName") ?? ""),
    productTier: String(formData.get("productTier") ?? ""),
    documentType: String(formData.get("documentType") ?? ""),
    contractingMode: String(formData.get("contractingMode") ?? "unknown"),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    retrievedAt: String(formData.get("retrievedAt") ?? ""),
    rawText: String(formData.get("rawText") ?? ""),
  };

  const parsed = AnalysisInputSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      if (!errors[field]) errors[field] = issue.message;
    }
    return { ok: false, errors, message: "Revisá los campos marcados." };
  }

  const input = parsed.data;
  const sourceUrl = input.sourceUrl && input.sourceUrl.length > 0 ? input.sourceUrl : null;

  const id = buildAnalysisId(input);

  // 1) Guardar el texto original como .txt
  await saveRawText(id, input.rawText);

  // 2) Ejecutar el parser determinístico (documentos cargados a mano NO son mock)
  const mode = input.contractingMode;
  const analysis = parseLicense({
    id,
    providerName: input.providerName,
    productName: input.productName,
    productTier: input.productTier,
    documentType: input.documentType,
    sourceUrl,
    retrievedAt: input.retrievedAt,
    rawTextPath: rawTextRelativePath(id),
    rawText: input.rawText,
    isMock: false,
    contractingMode: mode,
    appliesToModes: mode === "all" || mode === "unknown" ? [] : [mode],
    sourceScope: mode === "all" ? "general" : mode === "unknown" ? "unclear" : "mode_specific",
  });

  // 3) Validar + persistir el JSON
  await saveLicenseAnalysis(analysis);

  // 4) Navegar al análisis creado
  redirect(`/analysis/${id}`);
}
