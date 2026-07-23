# Shared helpers for repo scripts. Source this file; do not execute it.
# Conventions: strict mode, idempotent scripts, non-interactive, actionable errors.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEV_DIR="$REPO_ROOT/.dev"
LOG_DIR="$DEV_DIR/logs"
PID_DIR="$DEV_DIR/pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m"

log() { echo -e "${GREEN}[repobot-base]${NC} $*"; }
warn() { echo -e "${YELLOW}[repobot-base]${NC} $*"; }
fail() {
    echo -e "${RED}[repobot-base] ERROR:${NC} $*" >&2
    exit 1
}

require_command() {
    local cmd="$1"
    local hint="$2"
    command -v "$cmd" >/dev/null 2>&1 || fail "'$cmd' is not installed. $hint"
}

require_docker() {
    require_command docker "Install Docker Desktop, or set DB_MODE=embedded to run Postgres without Docker."
    docker info >/dev/null 2>&1 || fail "Docker is installed but not running. Start Docker Desktop, or set DB_MODE=embedded."
}

# resolve_db_container_port <container> <default_port>
# Prints the host port a running database container is actually mapped to,
# falling back to the default when the container isn't running. Machines that
# host several checkouts remap ports (e.g. base-local-test on 55433 because
# another project owns 5433); scripts that assume the default silently talk
# to a foreign Postgres and fail with password errors.
resolve_db_container_port() {
    local container="$1" default_port="$2" mapped
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
        mapped="$(docker port "$container" 5432/tcp 2>/dev/null | head -1 | awk -F: '{print $NF}')"
        if [ -n "$mapped" ]; then
            echo "$mapped"
            return 0
        fi
    fi
    echo "$default_port"
}

# port_open <host> <port> — bash-builtin TCP probe (no nc dependency; slim
# containers like the Repobot sandbox image don't ship netcat).
port_open() {
    (exec 3<>"/dev/tcp/$1/$2") 2>/dev/null && exec 3>&- 3<&-
}

# wait_for_port <host> <port> <timeout_seconds> <label>
wait_for_port() {
    local host="$1" port="$2" timeout="$3" label="$4"
    local waited=0
    until port_open "$host" "$port"; do
        sleep 1
        waited=$((waited + 1))
        if [ "$waited" -ge "$timeout" ]; then
            fail "$label did not become ready on $host:$port within ${timeout}s. Check logs in $LOG_DIR."
        fi
    done
}

# start_background <name> <logfile> <command...>
# Starts a long-running process, records its pid, and is a no-op if already running.
start_background() {
    local name="$1"
    shift
    local pidfile="$PID_DIR/$name.pid"
    if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
        log "$name already running (pid $(cat "$pidfile"))."
        return 0
    fi
    local logfile="$LOG_DIR/$name.log"
    log "Starting $name (logs: $logfile)"
    # Detach into a new session (not just nohup): the invoking shell may kill
    # its whole process group on exit, e.g. when dev-up runs with --no-wait.
    node -e '
        const { spawn } = require("node:child_process")
        const fs = require("node:fs")
        const [logfile, pidfile, ...cmd] = process.argv.slice(1)
        const out = fs.openSync(logfile, "a")
        const child = spawn(cmd[0], cmd.slice(1), { detached: true, stdio: ["ignore", out, out] })
        fs.writeFileSync(pidfile, String(child.pid))
        child.unref()
    ' "$logfile" "$pidfile" "$@"
}

stop_background() {
    local name="$1"
    local pidfile="$PID_DIR/$name.pid"
    if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
        local pid
        pid="$(cat "$pidfile")"
        log "Stopping $name (pid $pid)."
        # start_background detaches into its own process group, so kill the
        # whole group: npm/sh wrappers spawn grandchildren (vite, emulators)
        # that a plain kill + pkill -P would orphan, leaving them squatting on
        # dev ports after "down" reports success.
        kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
        pkill -P "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
}

process_status() {
    local name="$1"
    local pidfile="$PID_DIR/$name.pid"
    if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
        echo "up (pid $(cat "$pidfile"))"
    else
        echo "down"
    fi
}
