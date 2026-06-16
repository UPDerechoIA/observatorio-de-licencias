import Link from "next/link";
import { PROVIDER_REGION_VALUES, providerRegionLabel, type ProviderRegion } from "@/domain/taxonomies/providerRegions";
import { providerTypeLabel, isNonCommercialProject } from "@/domain/taxonomies/providerTypes";
import { productNicheInfo } from "@/domain/taxonomies/productNiches";

export interface RegionalRow {
  providerId: string;
  providerName: string;
  region: string;
  type: string;
  /** Productos del proveedor con su nicho funcional. */
  products: { productName: string; niche: string }[];
  /** Route id del expediente (solo si hay análisis; si no, null). */
  dossierId: string | null;
  /** Fuente oficial (doc con URL o dominio oficial). */
  officialUrl: string | null;
  needsReview: boolean;
}

// Orden de regiones: primero las menos representadas en el eje EEUU/China.
const REGION_ORDER: ProviderRegion[] = [...PROVIDER_REGION_VALUES].sort((a, b) => {
  const pref = ["latin_america", "africa", "europe", "asia", "north_america", "global", "unknown"];
  return pref.indexOf(a) - pref.indexOf(b);
}) as ProviderRegion[];

/**
 * Directorio de proveedores y proyectos por región. Para cada producto muestra,
 * en lenguaje claro: tipo de herramienta, qué hace y qué debe mirar un abogado.
 */
export function RegionalProviders({ rows }: { rows: RegionalRow[] }) {
  const byRegion = REGION_ORDER.map((region) => ({
    region,
    items: rows.filter((r) => r.region === region).sort((a, b) => a.providerName.localeCompare(b.providerName)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {byRegion.map(({ region, items }) => (
        <div key={region}>
          <h3 className="mb-2 text-sm font-medium text-slate-800">{providerRegionLabel(region)}</h3>
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.providerId} className="rounded border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">{r.providerName}</span>
                    <span className="text-slate-500">
                      {" · "}
                      {providerRegionLabel(r.region)}
                      {" · "}
                      <span className={isNonCommercialProject(r.type) ? "text-sky-700" : undefined}>
                        {providerTypeLabel(r.type)}
                      </span>
                    </span>
                    {r.needsReview && <span className="ml-2 text-xs text-amber-700">· requiere revisión de fuente</span>}
                  </div>
                  <div className="shrink-0 text-xs">
                    {r.dossierId ? (
                      <Link href={`/providers/${r.dossierId}`} className="text-sky-700 hover:underline">
                        Ver expediente →
                      </Link>
                    ) : r.officialUrl ? (
                      <a href={r.officialUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                        Fuente oficial →
                      </a>
                    ) : (
                      <span className="text-slate-400">Sin fuente registrada</span>
                    )}
                  </div>
                </div>

                <ul className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                  {r.products.map((p) => {
                    const info = productNicheInfo(p.niche);
                    return (
                      <li key={p.productName} className="text-sm leading-relaxed">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium text-slate-800">{p.productName}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                            {info.label}
                          </span>
                        </div>
                        <p className="text-slate-600">{info.plainDescription}</p>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium text-slate-600">Para el abogado:</span> {info.legalReadingHint}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
