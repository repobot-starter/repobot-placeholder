#!/usr/bin/env bash
# Report the state of every local component: db, functions emulator, web.

source "$(dirname "$0")/lib/common.sh"

port_status() {
    if port_open 127.0.0.1 "$1"; then echo "up"; else echo "down"; fi
}

DB_PORT="${DB_PORT:-5432}"
DB_TEST_PORT="${DB_TEST_PORT:-5433}"

echo "component        state                    port   logs"
echo "---------        -----                    ----   ----"
echo "postgres-core    $(port_status "$DB_PORT")      $DB_PORT   (docker logs base-local-core | .devdata/pg-core.log)"
echo "postgres-test    $(port_status "$DB_TEST_PORT")      $DB_TEST_PORT   (docker logs base-local-test | .devdata/pg-test.log)"
echo "functions        $(process_status functions), port $(port_status 5001)   5001   $LOG_DIR/functions.log"
echo "web              $(process_status web), port $(port_status "${PORT:-5173}")   ${PORT:-5173}   $LOG_DIR/web.log"
