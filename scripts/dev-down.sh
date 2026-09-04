#!/usr/bin/env bash
# Stop everything dev-up started. Databases are stopped but their data is kept
# (use 'npm run dev:db:reset' to wipe).

source "$(dirname "$0")/lib/common.sh"

stop_background web
stop_background functions
rm -f "$DEV_DIR/web-port"
rm -f "$DEV_DIR/functions-port"
# The stack is going down; the readiness marker must not outlive it.
rm -f "$DEV_DIR/stack-ready"

DB_MODE="${DB_MODE:-docker}"
if [ "$DB_MODE" = "embedded" ]; then
    node "$REPO_ROOT/scripts/lib/embedded-pg.mjs" stop core || true
    node "$REPO_ROOT/scripts/lib/embedded-pg.mjs" stop test || true
else
    docker stop base-local-core >/dev/null 2>&1 && log "Stopped base-local-core." || true
    docker stop base-local-test >/dev/null 2>&1 && log "Stopped base-local-test." || true
fi

log "All services stopped."
