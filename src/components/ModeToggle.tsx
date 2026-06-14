"use client";

import { useMode } from "./ModeProvider";

/** Toggle global de lenguaje: claro / jurídico. */
export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div
      role="group"
      aria-label="Modo de lenguaje"
      className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 text-sm shadow-sm"
    >
      <button
        type="button"
        onClick={() => setMode("claro")}
        aria-pressed={mode === "claro"}
        className={`rounded-md px-3 py-1.5 font-medium transition ${
          mode === "claro" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Lenguaje claro
      </button>
      <button
        type="button"
        onClick={() => setMode("juridico")}
        aria-pressed={mode === "juridico"}
        className={`rounded-md px-3 py-1.5 font-medium transition ${
          mode === "juridico" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Lenguaje jurídico
      </button>
    </div>
  );
}

/** Renderiza el texto correcto según el modo activo. */
export function ModeText({ plain, legal }: { plain: string; legal: string }) {
  const { mode } = useMode();
  return <>{mode === "claro" ? plain : legal}</>;
}
