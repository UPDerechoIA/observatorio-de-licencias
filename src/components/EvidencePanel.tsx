"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/schema";

/**
 * Muestra la evidencia textual de un hallazgo. La evidencia es visible y
 * copiable; nunca queda escondida detrás de la conclusión.
 */
export function EvidencePanel({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Sin evidencia textual. Una conclusión sin evidencia debe tratarse como no respaldada.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {evidence.map((ev, i) => (
        <EvidenceItem key={i} evidence={ev} />
      ))}
    </ul>
  );
}

function EvidenceItem({ evidence }: { evidence: Evidence }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(evidence.quote);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // El portapapeles puede no estar disponible; no es crítico.
    }
  }

  return (
    <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <blockquote className="evidence-quote text-sm leading-relaxed text-slate-800">
        “{evidence.quote}”
      </blockquote>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{evidence.locationHint ?? "ubicación no determinada"}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
    </li>
  );
}
