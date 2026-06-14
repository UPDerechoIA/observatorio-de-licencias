import Link from "next/link";
import type { ProviderSummary } from "@/lib/derive";
import { MODE_LABELS } from "@/lib/analysisMeta";
import { Dot, riskWord, postureWord } from "./indicators";
import type { PrivacyPosture } from "@/lib/schema";
import type { RiskLevel } from "@/lib/types";

const RISK_TONE: Record<string, "red" | "amber" | "emerald" | "slate"> = { high: "red", medium: "amber", low: "emerald", unknown: "slate" };
const POSTURE_TONE: Record<string, "red" | "amber" | "emerald" | "sky" | "slate"> = { strong: "emerald", moderate: "sky", weak: "amber", unknown: "slate" };

/** Lista de proveedores (no documentos): una fila por proveedor. */
export function ProviderOverview({
  summaries,
  pendingByProvider,
}: {
  summaries: ProviderSummary[];
  pendingByProvider: Record<string, number>;
}) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-medium">Proveedor</th>
            <th className="px-3 py-2 font-medium">Productos</th>
            <th className="px-3 py-2 font-medium">Documentos</th>
            <th className="px-3 py-2 font-medium">Modalidades</th>
            <th className="px-3 py-2 font-medium">Pendientes</th>
            <th className="px-3 py-2 font-medium">Sin revisión</th>
            <th className="px-3 py-2 font-medium">Peor riesgo</th>
            <th className="px-3 py-2 font-medium">Privacidad más débil</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.providerId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
              <td className="px-3 py-2 font-medium text-slate-900">{s.providerName}</td>
              <td className="px-3 py-2 text-slate-600">{s.products.join(", ")}</td>
              <td className="px-3 py-2 text-slate-700">{s.docCount}</td>
              <td className="px-3 py-2 text-slate-600">{s.modes.filter((m) => m !== "all" && m !== "unknown").map((m) => MODE_LABELS[m]).join(", ") || "—"}</td>
              <td className="px-3 py-2 text-slate-700">{pendingByProvider[s.providerId] ?? 0}</td>
              <td className="px-3 py-2 text-slate-700">{s.unreviewed}</td>
              <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                <Dot tone={RISK_TONE[s.worstRisk] ?? "slate"} />
                {riskWord(s.worstRisk as RiskLevel)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                <Dot tone={POSTURE_TONE[s.weakestPrivacy] ?? "slate"} />
                {postureWord(s.weakestPrivacy as PrivacyPosture)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Link href={`/providers/${s.providerId}`} className="text-sky-700 hover:underline">Ver proveedor →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
