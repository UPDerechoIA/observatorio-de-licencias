import { notFound } from "next/navigation";
import { loadAllLicenseAnalyses } from "@/lib/storage";
import { loadRegistry, flattenDocuments } from "@/lib/sources";
import { providerKey } from "@/lib/derive";
import { ProviderDossier, type PendingDoc } from "@/components/ProviderDossier";

export const dynamic = "force-dynamic";

export default async function ProviderPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const all = await loadAllLicenseAnalyses();
  const analyses = all.filter((a) => providerKey(a) === providerId);
  if (analyses.length === 0) notFound();

  // Documentos pendientes / no disponibles del registro para este proveedor.
  let pending: PendingDoc[] = [];
  try {
    const reg = await loadRegistry();
    pending = flattenDocuments(reg, providerId)
      .filter((d) => d.document.sourceStatus !== "verified")
      .map((d) => ({
        documentType: d.document.documentType,
        sourceStatus: d.document.sourceStatus,
        sourceUrl: d.document.sourceUrl,
      }));
  } catch {
    pending = [];
  }

  return (
    <div className="space-y-4">
      <ProviderDossier analyses={analyses} pending={pending} />
    </div>
  );
}
