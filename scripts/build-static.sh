#!/usr/bin/env bash
#
# Build estático para GitHub Pages -> genera ./out
#
# Por qué este script existe:
#   `output: 'export'` de Next es incompatible con Server Actions. La página
#   /upload usa un server action (carga web local), así que hay que sacarla del
#   árbol de build SOLO para el export. Lo hacemos moviéndola temporalmente y
#   restaurándola con un trap, para que ni el repo local ni el runner queden
#   modificados. Un único script asegura que el build local y el de CI no
#   diverjan.
#
# Uso: bash scripts/build-static.sh
set -euo pipefail
cd "$(dirname "$0")/.."

UPLOAD_DIR="src/app/upload"
BACKUP_DIR="$(mktemp -d)/upload"

restore() {
  if [ -d "$BACKUP_DIR" ]; then
    rm -rf "$UPLOAD_DIR"
    mv "$BACKUP_DIR" "$UPLOAD_DIR"
  fi
}
trap restore EXIT

if [ -d "$UPLOAD_DIR" ]; then
  mv "$UPLOAD_DIR" "$BACKUP_DIR"
fi

# NEXT_PUBLIC_STATIC_EXPORT activa output:export + basePath + trailingSlash en
# next.config.mjs y oculta el link "+ Cargar licencia" del Header.
NEXT_PUBLIC_STATIC_EXPORT=true npm run build

echo "Export estático generado en ./out"
