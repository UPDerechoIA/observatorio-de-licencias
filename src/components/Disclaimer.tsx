/** Descargo general: el MVP no es asesoramiento legal. */
export function LegalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      UP-Law-AILO es una herramienta de análisis preliminar, trazabilidad y lectura comparada.
      No constituye asesoramiento legal. Todo resultado queda sujeto a revisión legal humana.
    </p>
  );
}
