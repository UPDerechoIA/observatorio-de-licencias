import { loadAllLicenseAnalyses } from "@/lib/storage";
import { loadRegistry, flattenDocuments } from "@/lib/sources";
import { providerSummaries } from "@/lib/derive";
import { ProviderOverview } from "@/components/ProviderOverview";

export const metadata = { title: "Proveedores — UP-Law-AILO" };

export default async function ProvidersPage() {
  const analyses = await loadAllLicenseAnalyses();
  const summaries = providerSummaries(analyses);

  // Documentos pendientes (en el registro, fuente no verificada) por proveedor.
  const pendingByProvider: Record<string, number> = {};
  try {
    const reg = await loadRegistry();
    for (const { provider, document } of flattenDocuments(reg)) {
      if (document.sourceStatus !== "verified") {
        pendingByProvider[provider.providerId] = (pendingByProvider[provider.providerId] ?? 0) + 1;
      }
    }
  } catch {
    // sin registro: sin conteo de pendientes
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Proveedores</h1>
        <p className="text-sm text-slate-600">
          Un proveedor por fila. Entrá a cada uno para ver su expediente organizado por modalidad de
          contratación, con documentos existentes y faltantes.
        </p>
      </header>

      {summaries.length === 0 ? (
        <p className="text-sm text-slate-500">No hay proveedores cargados.</p>
      ) : (
        <ProviderOverview summaries={summaries} pendingByProvider={pendingByProvider} />
      )}

    </div>
  );
}
