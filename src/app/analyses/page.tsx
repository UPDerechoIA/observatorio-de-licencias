import { loadAllLicenseAnalyses } from "@/lib/storage";
import { AnalysisTable } from "@/components/AnalysisTable";

export const metadata = { title: "Tabla de análisis — UP-Law-AILO" };

export default async function AnalysesPage() {
  const analyses = await loadAllLicenseAnalyses();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Tabla de análisis</h1>
        <p className="text-sm text-slate-600">
          Registro documental. Cada fila es un análisis preliminar de un documento, con su modalidad,
          perfil de privacidad, riesgo contractual y trazabilidad de fuente.
        </p>
      </header>
      <AnalysisTable analyses={analyses} />
    </div>
  );
}
