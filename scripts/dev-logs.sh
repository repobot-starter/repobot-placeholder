#!/usr/bin/env bash
# Tail all dev service logs.
source "$(dirname "$0")/lib/common.sh"
touch "$LOG_DIR/web.log" "$LOG_DIR/functions.log"
tail -n 50 -f "$LOG_DIR"/*.log
