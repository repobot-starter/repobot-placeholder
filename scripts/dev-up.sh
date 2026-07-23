#!/usr/bin/env bash
# One command to a running stack: env -> db -> migrate -> codegen -> functions emulator -> web.
#
# Usage:   scripts/dev-up.sh [--no-wait]
# Env:     DB_MODE=docker|embedded (default docker; sandboxes use embedded)
#          PORT (web dev server port, default 5173)
#
# Idempotent: components that are already running are left alone.
# The web dev server is started as early as possible so browser healthchecks
# pass while the backend finishes booting.

source "$(dirname "$0")/lib/common.sh"
cd "$REPO_ROOT"

WEB_PORT="${PORT:-5173}"
export DB_PORT="${DB_PORT:-5432}"
# The db port flows into the generated .env.local via DATABASE_URL (env wins over manifest defaults).
export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@127.0.0.1:$DB_PORT/postgres}"

# 1. Env files (no-op if they already exist).
node scripts/bootstrap-env.mjs

# 2. Database.
bash scripts/dev-db.sh

# 3. Codegen (only when the generated outputs are missing; codegen.sh is cheap to re-run).
if [ ! -d firebase/functions/generated ] || [ ! -d web/app/src/generated ]; then
    bash scripts/codegen.sh
fi

# 4. Web dev server first (fast to boot; serves the healthcheck target).
start_background web env PORT="$WEB_PORT" npm --workspace web/app run dev -- --host 127.0.0.1 --port "$WEB_PORT" --strictPort

# 5. Migrations.
npm --workspace firebase/functions run migrate

# 6. Build functions + emulator.
npm --workspace firebase/functions run build
start_background functions npx firebase-tools emulators:start --only functions --project demo-repobot-base

wait_for_port 127.0.0.1 "$WEB_PORT" 120 "web dev server"
wait_for_port 127.0.0.1 5001 180 "functions emulator"

log "Stack is up:"
log "  web:       http://127.0.0.1:$WEB_PORT"
log "  graphql:   http://127.0.0.1:5001/demo-repobot-base/us-central1/graphql__request__api"
log "  postgres:  127.0.0.1:$DB_PORT"

if [ "${1:-}" = "--no-wait" ]; then
    exit 0
fi

# Keep the foreground process alive (the sandbox runtime supervises this pid).
log "Press Ctrl+C to stop tailing (services keep running; use 'npm run dev:down' to stop them)."
tail -f "$LOG_DIR/web.log" "$LOG_DIR/functions.log"
