import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAllLicenseAnalyses } from "@/lib/storage";
import { MODE_LABELS } from "@/lib/contractingModes";
import { SENSITIVITY_LABEL } from "@/domain/legalUseScenarios";
import {
  getReadingGuide,
  getAllReadingGuides,
  getDocumentsForReadingGuide,
  getClausesForReadingGuide,
  READING_PRIORITY_LABEL,
  type ReadingPriority,
  type DocumentToRead,
} from "@/domain/readingGuides";

export async function generateStaticParams() {
  return getAllReadingGuides().map((g) => ({ scenarioId: g.id }));
}

// Prioridad de lectura = qué leer primero (no es riesgo): tonos neutros.
const PRIORITY_TONE: Record<ReadingPriority, string> = {
  high: "text-slate-900 font-medium",
  medium: "text-slate-700",
  low: "text-slate-500",
  insufficient: "text-slate-400",
};

const PRIORITY_ORDER: ReadingPriority[] = ["high", "medium", "low"];

export default async function ScenarioReadingGuidePage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params;
  const guide = getReadingGuide(scenarioId);
  if (!guide) notFound();

  const analyses = await loadAllLicenseAnalyses();
  const documents = getDocumentsForReadingGuide(guide, analyses);
  const clauses = getClausesForReadingGuide(guide, analyses);
  const byPriority = PRIORITY_ORDER.map((p) => ({ priority: p, docs: documents.filter((d) => d.readingPriority === p) })).filter((g) => g.docs.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <Link href="/escenarios" className="text-sm text-sky-700 hover:underline">← Escenarios</Link>

      <header className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Guía de lectura · {SENSITIVITY_LABEL[guide.sensitivity as keyof typeof SENSITIVITY_LABEL] ?? guide.sensitivity}
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">{guide.title}</h1>
        <p className="text-sm leading-relaxed text-slate-600">{guide.description}</p>
        <p className="font-serif text-lg text-slate-800">{guide.guidingQuestion}</p>
      </header>

      {/* Documentos que debés leer */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Documentos que debés leer</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ordenados por <strong>prioridad de lectura</strong> (qué leer primero según las cláusulas presentes),
          no por una conclusión jurídica.
        </p>
        {byPriority.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No se encontró evidencia suficiente en el corpus para este escenario.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {byPriority.map((grp) => (
              <div key={grp.priority}>
                <h3 className={`text-sm ${PRIORITY_TONE[grp.priority]}`}>{READING_PRIORITY_LABEL[grp.priority]} ({grp.docs.length})</h3>
                <div className="mt-1 divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
                  {grp.docs.map((d) => <DocRow key={d.analysisId} d={d} />)}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Conviene leer también, cuando existan: {guide.requiredDocumentTypes.join(" · ")}.
        </p>
      </section>

      {/* Cláusulas a revisar */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cláusulas a revisar</h2>
        <div className="mt-2 space-y-3">
          {clauses.map((c) => (
            <div key={c.key} className="rounded-md border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-medium text-slate-900">{c.label}</h3>
              {c.concern && <p className="mt-0.5 text-sm text-slate-600">{c.concern}.</p>}
              {c.documentsWithEvidence.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {c.documentsWithEvidence.slice(0, 4).map((d, i) => (
                    <li key={i} className="text-sm">
                      <Link href={`/analysis/${d.analysisId}`} className="text-sky-700 hover:underline">
                        {d.providerName} · {d.documentType}
                      </Link>
                      {d.quotes[0] && <p className="evidence-quote mt-0.5 border-l-2 border-slate-200 pl-2 text-xs text-slate-500">“{d.quotes[0]}”</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Sin evidencia textual detectada para esta cláusula en el corpus.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <p className="rounded-md border border-l-4 border-slate-200 border-l-gold-500 bg-white p-3 text-sm leading-relaxed text-slate-700">
        {guide.limitations}
      </p>
    </div>
  );
}

function DocRow({ d }: { d: DocumentToRead }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
      <div>
        <Link href={`/analysis/${d.analysisId}`} className="font-medium text-slate-900 hover:underline">
          {d.providerName} · {d.productName}
        </Link>
        <span className="text-slate-500"> · {d.documentType}</span>
        <div className="text-xs text-slate-500">
          Modalidad: {MODE_LABELS[d.contractingMode as keyof typeof MODE_LABELS] ?? d.contractingMode}
          {d.whyRead.length > 0 && <> · Contiene: {d.whyRead.slice(0, 4).join(", ")}</>}
        </div>
      </div>
      <Link href={`/analysis/${d.analysisId}`} className="whitespace-nowrap text-xs text-sky-700 hover:underline">Abrir dossier →</Link>
    </div>
  );
}
