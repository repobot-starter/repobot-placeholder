#!/usr/bin/env bash
#
# Sandbox preview entry point (referenced by repobot.sandbox.json).
#
# With a connected Shopify store the Repobot workspace injects:
#   SHOPIFY_FLAG_STORE        the store domain (e.g. my-store.myshopify.com)
#   SHOPIFY_CLI_THEME_TOKEN   a Theme Access token
# and this runs `shopify theme dev`, streaming a live preview of THIS theme
# against the store's real products.
#
# Without a store connection it serves a static explainer page on ${PORT} so
# the workspace preview still comes up and tells the user what to connect.

set -euo pipefail

PORT="${PORT:-9292}"

if [[ -n "${SHOPIFY_FLAG_STORE:-}" && -n "${SHOPIFY_CLI_THEME_TOKEN:-}" ]]; then
    # No --theme-editor-sync: on CLI 3.x it triggers an interactive
    # "Reconciliation Strategy" prompt whenever the store's theme JSON
    # differs from this repo (any theme-editor edit guarantees that), and
    # a headless workspace cannot answer it — the preview dies at boot.
    # This repo is the source of truth; editor-side edits stay on the
    # store's own theme. CLI 4's --reconciliation-strategy makes the sync
    # answerable non-interactively if it is ever wanted back.
    exec npx shopify theme dev \
        --store "${SHOPIFY_FLAG_STORE}" \
        --host 127.0.0.1 \
        --port "${PORT}"
fi

echo "No Shopify store connected; serving the sample-data storefront preview on :${PORT}." >&2
exec node scripts/preview-fallback.mjs
