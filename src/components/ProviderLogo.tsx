"use client";

import { useState } from "react";
import { colorFor, initials } from "@/lib/providerLogoUtils";

/**
 * Identifica un proveedor con su logo local (`src`); si no hay logo o falla la
 * carga, cae a un monograma con iniciales y color determinístico por id. Sin
 * servicios externos de logos; los SVG no se recolorean (se muestran tal cual).
 *
 * Contención uniforme: TODO (logo o monograma) se renderiza dentro de un "chip"
 * cuadrado del mismo tamaño por vista. El logo se ajusta con `object-fit:
 * contain`, de modo que logos cuadrados, anchos o altos ocupen el mismo lugar y
 * la grilla quede pareja. La lógica pura vive en `@/lib/providerLogoUtils`.
 */
export function ProviderLogo({ src, providerId, providerName, size = 28 }: {
  src?: string; providerId: string; providerName: string; size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;

  const chip: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    overflow: "hidden",
    background: showImg ? "var(--color-background-secondary, #fff)" : colorFor(providerId),
    border: showImg ? "1px solid rgba(15,23,42,0.10)" : "none",
    padding: showImg ? Math.round(size * 0.14) : 0,
  };

  if (showImg) {
    return (
      <span style={chip} role="img" aria-label={providerName} title={providerName}>
        <img
          src={src}
          alt={providerName}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span role="img" aria-label={providerName} title={providerName}
      style={{ ...chip, color: "#fff", fontSize: size * 0.42, fontWeight: 600, fontFamily: "var(--font-sans, sans-serif)" }}>
      {initials(providerName)}
    </span>
  );
}
