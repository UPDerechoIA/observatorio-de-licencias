import Link from "next/link";
import {
  type LegalBundle,
  DOCUMENT_ROLE_LABEL,
  COVERAGE_STATUS_LABEL,
} from "@/lib/coverage";
import { MODE_LABELS } from "@/lib/contractingModes";

const STATUS_TONE: Record<string, string> = {
  verified_base_document: "text-emerald-700",
  verified_product_specific: "text-emerald-700",
  referenced_canonical_document: "text-sky-700",
  not_found_after_official_search: "text-slate-500",
  unclear_scope: "text-amber-700",
  needs_manual_review: "text-amber-700",
  unsupported_format: "text-red-700",
  failed_fetch: "text-red-700",
};

const BUNDLE_STATUS_LABEL: Record<string, string> = {
  resolved: "Resuelto",
  partially_resolved: "Parcialmente resuelto",
  unresolved: "Sin resolver",
};

/**
 * Muestra el paquete jurídico de un producto (Gmail, Android, …): no lo cierra
 * como "lo cubren los términos generales", sino que distingue documentos base
 * referenciados, específicos del producto, por modalidad y lo no encontrado.
 */
export function LegalBundlePanel({ bundle }: { bundle: LegalBundle }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium text-slate-900">
          {bundle.productName} <span className="text-sm font-normal text-slate-500">· paquete jurídico</span>
        </h3>
        <span className="text-xs text-slate-500">{BUNDLE_STATUS_LABEL[bundle.bundleStatus] ?? bundle.bundleStatus}</span>
      </header>

      <p className="mt-1 text-sm leading-relaxed text-slate-600">{bundle.summary}</p>

      <ul className="mt-3 space-y-2">
        {bundle.documents.map((d, i) => (
          <li key={i} className="border-t border-slate-100 pt-2 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-slate-800">
                <span className="text-xs uppercase tracking-wide text-slate-400">{DOCUMENT_ROLE_LABEL[d.documentRole]}</span>{" "}
                · {d.documentType}
              </span>
              <span className={`text-xs ${STATUS_TONE[d.status] ?? "text-slate-500"}`}>
                {COVERAGE_STATUS_LABEL[d.status] ?? d.status}
              </span>
            </div>
            {d.appliesToModes.length > 0 && (
              <div className="mt-0.5 text-xs text-slate-500">Modalidades: {d.appliesToModes.map((m) => MODE_LABELS[m]).join(", ")}</div>
            )}
            {d.evidenceQuote && <p className="mt-0.5 text-xs italic text-slate-500">“{d.evidenceQuote}”</p>}
            <div className="mt-0.5 flex flex-wrap gap-3 text-xs">
              {d.canonicalAnalysisId && (
                <Link href={`/analysis/${d.canonicalAnalysisId}`} className="text-sky-700 hover:underline">Ver análisis base</Link>
              )}
              {d.sourceUrl && (
                <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">Fuente oficial</a>
              )}
            </div>
          </li>
        ))}
      </ul>

      {bundle.unresolved.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <div className="text-xs uppercase tracking-wide text-slate-400">No encontrado / pendiente</div>
          <ul className="mt-1 space-y-1 text-sm text-slate-600">
            {bundle.unresolved.map((u, i) => (
              <li key={i}>
                · {u.documentType} — <span className="text-slate-500">{COVERAGE_STATUS_LABEL[u.status] ?? u.status}</span>
                <span className="block text-xs text-slate-500">{u.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
