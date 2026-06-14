import type { LicenseAnalysis } from "@/lib/schema";
import { MODE_LABELS, REVIEW_LABELS } from "@/lib/analysisMeta";

/** Encabezado del dossier jurídico documental. */
export function LegalDossierHeader({ analysis }: { analysis: LicenseAnalysis }) {
  const a = analysis;
  return (
    <header className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500">Dossier documental</p>
        <h1 className="text-xl font-bold text-slate-900">
          {a.providerName} · {a.productName}
        </h1>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <Item label="Modalidad" value={MODE_LABELS[a.contractingMode]} />
        <Item label="Documento" value={a.documentType} />
        <Item label="Fecha de obtención" value={(a.metadata.retrievedAt ?? a.retrievedAt).slice(0, 10)} />
        <Item label="Revisión" value={REVIEW_LABELS[a.metadata.reviewStatus] ?? a.metadata.reviewStatus} />
        <Item label="Tier del proveedor" value={a.productTier} />
      </dl>
      <p className="rounded border border-l-4 border-slate-200 border-l-gold-500 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Análisis preliminar. No constituye asesoramiento legal. Requiere revisión humana.
      </p>
    </header>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
