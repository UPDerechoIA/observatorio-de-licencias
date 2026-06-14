"use client";

/**
 * Estado global del modo de lenguaje: "claro" (no abogados) vs "juridico"
 * (abogados). Se persiste en localStorage para que la preferencia sobreviva a
 * la navegación. Todas las vistas comparten este mismo estado.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type LanguageMode = "claro" | "juridico";

interface ModeContextValue {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const STORAGE_KEY = "up-law-ailo:mode";

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<LanguageMode>("claro");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "claro" || stored === "juridico") setMode(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode debe usarse dentro de <ModeProvider>");
  return ctx;
}
