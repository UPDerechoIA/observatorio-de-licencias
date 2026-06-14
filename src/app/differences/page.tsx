import Link from "next/link";
import { loadAllLicenseAnalyses } from "@/lib/storage";
import type { LicenseAnalysis, PrivacyPosture } from "@/lib/schema";
import type { ContractingMode } from "@/lib/contractingModes";
import { MODE_LABELS } from "@/lib/analysisMeta";
import { RiskCompact, PrivacyCompact, ReviewCompact } from "@/components/indicators";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diferencias por modalidad — UP-Law-AILO" };

const CANONICAL: ContractingMode[] = ["free", "paid_individual", "team", "business", "enterprise", "api"];
const POSTURE_RANK: Record<PrivacyPosture, number> = { strong: 3, moderate: 2, weak: 1, unknown: 0 };
const KEY_SIGNALS: [string, string][] = [
  ["training_use", "entrenamiento"],
  ["data_retention", "retención"],
  ["confidentiality", "confid."],
  ["liability_limitation", "responsabilidad"],
  ["commercial_use", "uso comercial"],
];

function keySignals(d: LicenseAnalysis): string {
  const parts = KEY_SIGNALS.map(([k, lbl]) => `${lbl}: ${d.categories[k]?.status === "found" ? "detectada" : "—"}`);
  parts.push(`DPA: ${d.privacy.signals.includes("enterprise_dpa") ? "sí" : "—"}`);
  return parts.join(" · ");
}

export default async function DifferencesPage() {
  const analyses = await loadAllLicenseAnalyses();
  const groups = new Map<string, LicenseAnalysis[]>();
  for (const a of analyses) {
    const key = `${a.providerName}|||${a.productName}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(a);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Diferencias por modalidad</h1>
        <p className="text-sm text-slate-600">
          Por producto: qué documentos existen o faltan por modalidad, cuáles son generales y cuáles
          específicos. Las diferencias deben surgir de la fuente; no se trasladan condiciones de una
          modalidad a otra.
        </p>
      </header>

      {groups.size === 0 ? (
        <p className="text-sm text-slate-500">No hay análisis cargados.</p>
      ) : (
        Array.from(groups.entries()).map(([key, docs]) => <ProductDifferences key={key} docs={docs} />)
      )}

    </div>
  );
}

function ProductDifferences({ docs }: { docs: LicenseAnalysis[] }) {
  const provider = docs[0].providerName;
  const product = docs[0].productName;
  const relevant = CANONICAL.filter((m) => docs.some((d) => d.contractingMode === m || d.appliesToModes.includes(m)));

  const generalDocs = docs.filter((d) => d.contractingMode === "all");
  const specificDocs = docs.filter((d) => d.contractingMode !== "all" && d.contractingMode !== "unknown");
  const bestGeneral = Math.max(0, ...generalDocs.map((d) => POSTURE_RANK[d.privacy.posture]));
  const moreProtective = specificDocs.filter((d) => POSTURE_RANK[d.privacy.posture] > bestGeneral);

  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">{provider} · {product}</h2>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Modalidad</th>
              <th className="px-3 py-2 font-medium">Documento(s)</th>
              <th className="px-3 py-2 font-medium">Alcance</th>
              <th className="px-3 py-2 font-medium">Privacidad / Riesgo / Revisión</th>
              <th className="px-3 py-2 font-medium">Señales clave</th>
            </tr>
          </thead>
          <tbody>
            {relevant.map((m) => {
              const specific = docs.filter((d) => d.contractingMode === m);
              const general = docs.filter((d) => d.contractingMode === "all" && d.appliesToModes.includes(m));
              const applicable = specific.length > 0 ? specific : general;
              const ref = applicable[0];
              return (
                <tr key={m} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">{MODE_LABELS[m]}</td>
                  <td className="px-3 py-2">
                    {applicable.length === 0 ? (
                      <span className="text-slate-500">No se encontró documento específico.</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {applicable.map((d) => (
                          <li key={d.id}>
                            <Link href={`/analysis/${d.id}`} className="text-sky-700 hover:underline">{d.documentType}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {specific.length > 0
                      ? `Existe documento específico para modalidad ${MODE_LABELS[m].toLowerCase()}.`
                      : general.length > 0
                        ? "Condiciones generales. La fuente no distingue claramente esta modalidad."
                        : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {ref && (
                      <div className="space-y-0.5">
                        <PrivacyCompact analysis={ref} />
                        <RiskCompact analysis={ref} />
                        <ReviewCompact analysis={ref} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{ref ? keySignals(ref) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {moreProtective.length > 0 ? (
          <p className="text-slate-700">
            La modalidad {moreProtective.map((d) => MODE_LABELS[d.contractingMode]).join(", ")} parece tener un perfil
            de privacidad preliminar más protectorio que las condiciones generales. Requiere revisión legal humana.
          </p>
        ) : specificDocs.length === 0 ? (
          <p className="text-slate-700">Solo hay documentos de aplicación general: la fuente no distingue claramente por modalidad.</p>
        ) : (
          <p className="text-slate-700">No hay evidencia suficiente para afirmar que una modalidad sea más protectoria en privacidad.</p>
        )}
        <p className="text-xs italic text-slate-500">
          No trasladar automáticamente condiciones enterprise/business a usuarios gratuitos o pagos individuales.
        </p>
      </div>
    </section>
  );
}
