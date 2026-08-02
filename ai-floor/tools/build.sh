#!/usr/bin/env bash
# Bundle the scene into a single self-contained page.
#
# three.js has to be inlined rather than linked: the published artifact runs under a
# CSP that blocks every external host, so a CDN <script> tag would silently fail.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/dist/index.html"

mkdir -p "$ROOT/dist"
cat "$ROOT/src/overlay.html" > "$OUT"
{
  printf '\n<script>\n'; cat "$ROOT/vendor/three.min.js"
  printf '\n</script>\n<script>\n'; cat "$ROOT/vendor/OrbitControls.js"
  printf '\n</script>\n<script>\n'; cat "$ROOT/src/scene.js"
  printf '\n</script>\n'
} >> "$OUT"

node --check "$ROOT/src/scene.js"
printf 'built %s (%s bytes)\n' "$OUT" "$(wc -c < "$OUT")"
