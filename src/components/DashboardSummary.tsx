import type { DashboardMetrics } from "@/lib/derive";

/** Franja de métricas sobria (sin cards grandes): celdas finas con divisores. */
export function DashboardSummary({ metrics }: { metrics: DashboardMetrics }) {
  const cells: { label: string; value: number }[] = [
    { label: "Análisis totales", value: metrics.total },
    { label: "Proveedores", value: metrics.providers },
    { label: "Documentos reales", value: metrics.realDocs },
    { label: "Documentos mock", value: metrics.mockDocs },
    { label: "Fuentes verificadas", value: metrics.verifiedSources },
    { label: "Fuentes pendientes", value: metrics.pendingSources },
    { label: "Sin revisión legal", value: metrics.unreviewed },
    { label: "Modalidades detectadas", value: metrics.modesDetected },
  ];
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded border border-slate-200 bg-white sm:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="px-4 py-3">
          <div className="text-xl font-semibold text-slate-900">{c.value}</div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
