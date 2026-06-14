import Link from "next/link";
import { loadAllLicenseAnalyses } from "@/lib/storage";
import { loadRegistry, flattenDocuments } from "@/lib/sources";
import { computeMetrics } from "@/lib/derive";
import { DashboardSummary } from "@/components/DashboardSummary";

// La home lee el filesystem en cada request (la fuente de verdad es el disco).
export const dynamic = "force-dynamic";

const ACCESOS: { href: string; title: string; desc: string }[] = [
  { href: "/analyses", title: "Tabla de análisis", desc: "Registro documental filtrable y ordenable." },
  { href: "/providers", title: "Proveedores", desc: "Expediente por proveedor, organizado por modalidad." },
  { href: "/compare", title: "Matriz comparativa", desc: "Categorías jurídicas por proveedor / modalidad." },
  { href: "/differences", title: "Diferencias por modalidad", desc: "Qué cambia entre free, pago, team, enterprise y API." },
  { href: "/criteria", title: "Criterio de riesgo", desc: "Cómo se calculan riesgo y privacidad, y sus límites." },
];

export default async function HomePage() {
  const analyses = await loadAllLicenseAnalyses();
  let sourceStatuses: string[] = [];
  try {
    const reg = await loadRegistry();
    sourceStatuses = flattenDocuments(reg).map((d) => d.document.sourceStatus);
  } catch {
    sourceStatuses = [];
  }
  const metrics = computeMetrics(analyses, sourceStatuses);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Panel</h1>
        <p className="text-sm text-slate-600">
          Observatorio de observación jurídica comparada de licencias y condiciones de proveedores de IA.
        </p>
      </header>

      <DashboardSummary metrics={metrics} />

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Accesos</h2>
        <div className="divide-y divide-slate-200 overflow-hidden rounded border border-slate-200 bg-white">
          {ACCESOS.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
              <div>
                <div className="font-medium text-slate-900">{a.title}</div>
                <div className="text-sm text-slate-500">{a.desc}</div>
              </div>
              <span className="text-sky-700">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded border border-l-4 border-slate-200 border-l-gold-500 bg-white p-4">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold-600">Advertencia metodológica</h2>
        <p className="text-sm text-slate-700">
          UP-Law-AILO realiza análisis preliminar mediante parser determinístico y evidencia textual. Los
          niveles de riesgo y privacidad son señales de priorización para revisión legal humana. No
          constituyen asesoramiento legal.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Criterio resumido</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Criterio
            titulo="Riesgo contractual preliminar"
            texto="Señal de priorización derivada de las cláusulas detectadas (responsabilidad, indemnidad, arbitraje, jurisdicción, cambios de términos, entre otras). No es una conclusión jurídica."
          />
          <Criterio
            titulo="Perfil preliminar de privacidad"
            texto="Postura tentativa (fuerte / moderada / débil / sin datos) según señales como no-entrenamiento, DPA, retención o licencias amplias. Separada del riesgo contractual."
          />
          <Criterio
            titulo="Fuente verificada técnicamente"
            texto="La descarga respondió y el dominio final coincide con el dominio oficial del proveedor. No implica validación del contenido jurídico."
          />
          <Criterio
            titulo="Estado de revisión humana"
            texto="Indica si una persona abogada validó el análisis. Por defecto, sin revisar: todo resultado queda sujeto a revisión legal humana."
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Estos criterios sirven para priorizar revisión legal humana. No son conclusiones jurídicas definitivas.
          {" "}
          <Link href="/criteria" className="text-sky-700 underline">Ver criterio completo →</Link>
        </p>
      </section>
    </div>
  );
}

function Criterio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-1 text-sm text-slate-600">{texto}</p>
    </div>
  );
}
