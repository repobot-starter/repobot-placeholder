#!/usr/bin/env bash
# Start (or reset) the local Postgres databases.
#
# Usage:   scripts/dev-db.sh [--test] [--reset]
# Env:     DB_MODE=docker|embedded   (default: docker)
#
#   default   core database on 127.0.0.1:5432 (container base-local-core)
#   --test    test database on 127.0.0.1:5433 (container base-local-test)
#   --reset   destroy and recreate the database before starting
#
# Embedded mode uses the `embedded-postgres` npm package (real Postgres
# binaries, no Docker daemon) with data under .devdata/. Used in sandboxes.

source "$(dirname "$0")/lib/common.sh"

DB_MODE="${DB_MODE:-docker}"
TARGET="core"
RESET=false
for arg in "$@"; do
    case "$arg" in
        --test) TARGET="test" ;;
        --reset) RESET=true ;;
        *) fail "Unknown argument: $arg (expected --test and/or --reset)" ;;
    esac
done

if [ "$TARGET" = "test" ]; then
    PORT="${DB_TEST_PORT:-5433}"
    CONTAINER="base-local-test"
else
    PORT="${DB_PORT:-5432}"
    CONTAINER="base-local-core"
fi

if [ "$DB_MODE" = "embedded" ]; then
    if [ "$RESET" = true ]; then
        node "$REPO_ROOT/scripts/lib/embedded-pg.mjs" reset "$TARGET"
    fi
    node "$REPO_ROOT/scripts/lib/embedded-pg.mjs" start "$TARGET"
    wait_for_port 127.0.0.1 "$PORT" 60 "embedded Postgres ($TARGET)"
    log "Embedded Postgres ($TARGET) ready on 127.0.0.1:$PORT."
    exit 0
fi

require_docker

if [ "$RESET" = true ]; then
    log "Resetting $CONTAINER..."
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
fi

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    # The container may be mapped to a non-default host port (remapped when
    # another checkout owned the default). Trust the container, not the
    # assumption — otherwise we would "succeed" against a foreign Postgres.
    PORT="$(resolve_db_container_port "$CONTAINER" "$PORT")"
    log "Postgres ($TARGET) already running on 127.0.0.1:$PORT."
else
    if port_open 127.0.0.1 "$PORT"; then
        fail "Port $PORT is already in use by another process (not $CONTAINER). Set DB_PORT/DB_TEST_PORT to a free port (e.g. DB_PORT=55432 npm run dev:up) or stop the other service."
    fi
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
        log "Starting existing container $CONTAINER..."
        docker start "$CONTAINER" >/dev/null
    else
        log "Creating container $CONTAINER (postgres:16, port $PORT)..."
        docker run -d --name "$CONTAINER" \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_DB=postgres \
            -p "$PORT:5432" \
            postgres:16 >/dev/null
    fi
fi

wait_for_port 127.0.0.1 "$PORT" 60 "Postgres ($TARGET)"
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
log "Postgres ($TARGET) ready on 127.0.0.1:$PORT."
