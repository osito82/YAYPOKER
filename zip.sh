#!/bin/bash

# Nombre del archivo zip con timestamp
OUTPUT_FILE="deush_$(date +%Y%m%d_%H%M%S).zip"

echo "📦 Comprimiendo el proyecto en $OUTPUT_FILE..."

# Comprimir recursivamente
# -r: recursivo
# -x: excluir patrones
zip -r "$OUTPUT_FILE" . -x \
    "*/node_modules/*" \
    "*/Logs/*" \
    "node_modules/*" \
    "*/dist/*" \
    "dist/*" \
    "*/build/*" \
    "build/*" \
    "*/.git/*" \
    "*/.vscode/*" \
    ".vscode/*" \
    "*.log" \
    "$OUTPUT_FILE" \
    "zip.zip"

echo "✅ ¡Listo! Archivo creado: $OUTPUT_FILE"
