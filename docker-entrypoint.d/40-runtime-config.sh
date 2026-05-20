#!/bin/sh
set -eu

RUNTIME_CONFIG_PATH="/usr/share/nginx/html/runtime-config.js"

cat > "$RUNTIME_CONFIG_PATH" <<EOF
window.__stockproConfig = {
  googleClientId: "${GOOGLE_CLIENT_ID:-}",
  apiUrl: "${API_URL:-/api/v1}"
};
EOF
