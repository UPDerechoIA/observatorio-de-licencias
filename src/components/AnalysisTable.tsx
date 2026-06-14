"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LicenseAnalysis } from "@/lib/schema";
import {
  filterAnalyses,
  foundCount,
  EMPTY_FILTERS,
  type AnalysisFilterState,
} from "@/lib/derive";
import { MODE_LABELS } from "@/lib/analysisMeta";
import { RiskCompact, PrivacyCompact, SourceCompact, ReviewCompact } from "./indicators";

const RISK_RANK: Record<string, number> = { unknown: 0, low: 1, medium: 2, high: 3 };
const POSTURE_RANK: Record<string, number> = { unknown: 0, weak: 1, moderate: 2, strong: 3 };

type SortKey = "provider" | "product" | "modality" | "document" | "privacy" | "risk" | "review" | "date" | "found";

/**
 * Tabla principal de análisis: densa, sobria, filtrable, buscable y ordenable.
 * Reemplaza la grilla de tarjetas. Indicadores compactos (punto + texto), sin
 * cápsulas grandes.
 */
export function AnalysisTable({ analyses }: { analyses: LicenseAnalysis[] }) {
  const [f, setF] = useState<AnalysisFilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "provider", dir: 1 });

  const options = useMemo(() => {
    const uniq = (xs: string[]) => Array.from(new Set(xs)).sort();
    return {
      providers: uniq(analyses.map((a) => a.providerName)),
      documentTypes: uniq(analyses.map((a) => a.documentType)),
      modalities: uniq(analyses.map((a) => a.contractingMode)),
    };
  }, [analyses]);

  const rows = useMemo(() => {
    const filtered = filterAnalyses(analyses, f);
    const val = (a: LicenseAnalysis): string | number => {
      switch (sort.key) {
        case "provider": return a.providerName;
        case "product": return a.productName;
        case "modality": return MODE_LABELS[a.contractingMode];
        case "document": return a.documentType;
        case "privacy": return POSTURE_RANK[a.privacy.posture] ?? 0;
        case "risk": return RISK_RANK[a.overall.overallRiskLevel] ?? 0;
        case "review": return a.metadata.reviewStatus;
        case "date": return a.metadata.retrievedAt ?? a.retrievedAt;
        case "found": return foundCount(a);
      }
    };
    return [...filtered].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va < vb) return -1 * sort.dir;
      if (va > vb) return 1 * sort.dir;
      return 0;
    });
  }, [analyses, f, sort]);

  const set = (patch: Partial<AnalysisFilterState>) => setF((prev) => ({ ...prev, ...patch }));
  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));
  const sortMark = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : "");

  return (
    <div className="space-y-3">
      <Filters f={f} set={set} options={options} reset={() => setF(EMPTY_FILTERS)} count={rows.length} total={analyses.length} />

      {rows.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          Ningún análisis coincide con los filtros.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <Th onClick={() => toggleSort("provider")}>Proveedor{sortMark("provider")}</Th>
                <Th onClick={() => toggleSort("product")}>Producto{sortMark("product")}</Th>
                <Th onClick={() => toggleSort("modality")}>Modalidad{sortMark("modality")}</Th>
                <Th onClick={() => toggleSort("document")}>Documento{sortMark("document")}</Th>
                <Th onClick={() => toggleSort("privacy")}>Privacidad{sortMark("privacy")}</Th>
                <Th onClick={() => toggleSort("risk")}>Riesgo contractual{sortMark("risk")}</Th>
                <Th>Fuente</Th>
                <Th onClick={() => toggleSort("review")}>Revisión{sortMark("review")}</Th>
                <Th onClick={() => toggleSort("date")}>Fecha{sortMark("date")}</Th>
                <Th onClick={() => toggleSort("found")}>Hallazgos{sortMark("found")}</Th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-3 py-2 font-medium text-slate-900">{a.providerName}</td>
                  <td className="px-3 py-2 text-slate-700">{a.productName}</td>
                  <td className="px-3 py-2 text-slate-700">{MODE_LABELS[a.contractingMode]}</td>
                  <td className="px-3 py-2 text-slate-700">{a.documentType}</td>
                  <td className="px-3 py-2"><PrivacyCompact analysis={a} /></td>
                  <td className="px-3 py-2"><RiskCompact analysis={a} /></td>
                  <td className="px-3 py-2"><SourceCompact analysis={a} /></td>
                  <td className="px-3 py-2"><ReviewCompact analysis={a} /></td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">{(a.metadata.retrievedAt ?? a.retrievedAt).slice(0, 10)}</td>
                  <td className="px-3 py-2 text-slate-700">{foundCount(a)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/analysis/${a.id}`} className="text-sky-700 hover:underline">Dossier</Link>
                    <span className="text-slate-300"> · </span>
                    <Link href={`/analysis/${a.id}/source`} className="text-sky-700 hover:underline">Fuente</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th
      className={`px-3 py-2 font-medium ${onClick ? "cursor-pointer select-none hover:text-slate-800" : ""}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}

function Filters({
  f,
  set,
  options,
  reset,
  count,
  total,
}: {
  f: AnalysisFilterState;
  set: (patch: Partial<AnalysisFilterState>) => void;
  options: { providers: string[]; documentTypes: string[]; modalities: string[] };
  reset: () => void;
  count: number;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">Buscar</span>
        <input
          value={f.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Proveedor, producto, documento…"
          className="w-56 rounded border border-slate-300 px-2 py-1"
        />
      </label>
      <Sel label="Modalidad" value={f.modality} onChange={(v) => set({ modality: v })} options={options.modalities} render={(m) => MODE_LABELS[m as keyof typeof MODE_LABELS] ?? m} />
      <Sel label="Proveedor" value={f.provider} onChange={(v) => set({ provider: v })} options={options.providers} />
      <Sel label="Documento" value={f.documentType} onChange={(v) => set({ documentType: v })} options={options.documentTypes} />
      <Sel label="Riesgo" value={f.risk} onChange={(v) => set({ risk: v })} options={["low", "medium", "high", "unknown"]} render={(r) => ({ low: "bajo", medium: "medio", high: "alto", unknown: "desconocido" }[r] ?? r)} />
      <Sel label="Privacidad" value={f.privacy} onChange={(v) => set({ privacy: v })} options={["strong", "moderate", "weak", "unknown"]} render={(p) => ({ strong: "fuerte", moderate: "moderada", weak: "débil", unknown: "sin datos" }[p] ?? p)} />
      <Sel label="Fuente" value={f.source} onChange={(v) => set({ source: v })} options={["verified", "unverified"]} render={(s) => (s === "verified" ? "verificada" : "sin verificar")} />
      <Sel label="Revisión" value={f.review} onChange={(v) => set({ review: v })} options={["unreviewed", "needs_legal_review", "reviewed", "rejected"]} />
      <Sel label="Origen" value={f.kind} onChange={(v) => set({ kind: v })} options={["real", "mock"]} />
      <button type="button" onClick={reset} className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100">
        Limpiar
      </button>
      <span className="ml-auto text-xs text-slate-500">{count} de {total}</span>
    </div>
  );
}

function Sel({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  render?: (v: string) => string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1">
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o} value={o}>{render ? render(o) : o}</option>
        ))}
      </select>
    </label>
  );
}
