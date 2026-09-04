// Docker-free Postgres for sandboxes, using the binaries shipped with the
// `embedded-postgres` package but driving them via pg_ctl so the daemon
// properly detaches and outlives this script (the embedded-postgres JS API
// stops the server on process exit, which doesn't fit our scripted workflow).
//
// Usage: node scripts/lib/embedded-pg.mjs <start|stop|reset> <core|test>
// Ports: DB_PORT (core, default 5432) / DB_TEST_PORT (test, default 5433).
// Data lives under .devdata/pg-<target>; logs under .devdata/pg-<target>.log.
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import net from "node:net"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const [, , command, target = "core"] = process.argv

// Postgres refuses to run as root (initdb and the postmaster both check), and
// in sandbox pods the agent's shell IS root — the SDK offers no uid drop. Run
// every binary demoted to the sandbox uid instead of failing, so "start the
// test db and run the tests" works no matter who calls it. Outside root
// contexts this is a no-op.
const demote =
    typeof process.getuid === "function" && process.getuid() === 0
        ? {
              uid: Number(process.env.SANDBOX_UID ?? 1000),
              gid: Number(process.env.SANDBOX_GID ?? 1000),
          }
        : null

// The data dir, log file, and password file must belong to the demoted user
// before any demoted binary touches them. Idempotent; covers dirs left
// root-owned by earlier root runs.
function ensureOwnership() {
    if (!demote || !existsSync(path.dirname(dataDir))) return
    execFileSync("chown", ["-R", `${demote.uid}:${demote.gid}`, path.dirname(dataDir)])
}
const port =
    target === "test"
        ? Number(process.env.DB_TEST_PORT ?? 5433)
        : Number(process.env.DB_PORT ?? 5432)
const dataDir = path.join(repoRoot, ".devdata", `pg-${target}`)
const logFile = path.join(repoRoot, ".devdata", `pg-${target}.log`)

function binDir() {
    const platformPackage = `@embedded-postgres/${process.platform}-${process.arch}`
    const require = createRequire(import.meta.url)
    let entryPath
    try {
        // Resolves to <package>/dist/index.js without executing it; the package
        // exports map doesn't expose package.json, so resolve the entry instead.
        entryPath = require.resolve(platformPackage)
    } catch {
        console.error(
            `[embedded-pg] No Postgres binaries for ${process.platform}-${process.arch}. ` +
                `Expected package ${platformPackage} (installed via embedded-postgres).`,
        )
        process.exit(1)
    }
    return path.join(path.dirname(entryPath), "..", "native", "bin")
}

function run(binary, args) {
    execFileSync(path.join(binDir(), binary), args, { stdio: "inherit", ...(demote ?? {}) })
}

function initCluster() {
    mkdirSync(path.dirname(dataDir), { recursive: true })
    const passwordFile = path.join(path.dirname(dataDir), `.pg-${target}-pw`)
    writeFileSync(passwordFile, "postgres\n")
    ensureOwnership()
    try {
        run("initdb", [
            "-D",
            dataDir,
            "-U",
            "postgres",
            "--auth=password",
            `--pwfile=${passwordFile}`,
            "-E",
            "UTF8",
        ])
    } finally {
        rmSync(passwordFile, { force: true })
    }
}

function isRunning() {
    try {
        run("pg_ctl", ["-D", dataDir, "status"])
        return true
    } catch {
        return false
    }
}

// pg_ctl status only proves the postmaster PID is alive — after a non-clean
// shutdown (pod snapshots kill mid-write) the server can be up but still
// replaying WAL, answering every connection with SQLSTATE 57P03 ("the
// database system is starting up / in recovery mode"). Callers (migrate, the
// emulator) need actual connectability.
//
// The probe speaks the protocol itself over a raw socket instead of shelling
// out to a client binary: the embedded-postgres packages ship only initdb /
// pg_ctl / postgres (no pg_isready, no psql), so any external-binary probe
// is dead on arrival — on every platform, deterministically.

/**
 * One connection attempt: send a protocol-3.0 StartupMessage and classify
 * the server's first reply.
 *   { kind: "ready" }                 — AuthenticationRequest: the server is
 *                                       accepting sessions (auth would proceed).
 *   { kind: "retry", detail }         — transient by definition: connection
 *                                       refused/reset, probe timeout, or an
 *                                       ErrorResponse with SQLSTATE 57P03.
 *   { kind: "fatal", detail }         — anything else. Not a "wait longer"
 *                                       state; the caller fails immediately.
 */
function probeOnce() {
    return new Promise((resolve) => {
        const socket = net.connect({ host: "127.0.0.1", port })
        let buffered = Buffer.alloc(0)
        const settle = (kind, detail) => {
            socket.destroy()
            resolve({ kind, detail })
        }
        socket.setTimeout(3_000, () => settle("retry", "probe timed out after 3s"))
        socket.on("error", (error) => {
            const transient = error.code === "ECONNREFUSED" || error.code === "ECONNRESET"
            settle(transient ? "retry" : "fatal", `socket error: ${error.message}`)
        })
        socket.on("connect", () => {
            const params = Buffer.from("user\0postgres\0database\0postgres\0\0", "utf8")
            const startup = Buffer.alloc(8 + params.length)
            startup.writeInt32BE(startup.length, 0)
            startup.writeInt32BE(196608, 4) // protocol 3.0
            params.copy(startup, 8)
            socket.write(startup)
        })
        socket.on("data", (chunk) => {
            buffered = Buffer.concat([buffered, chunk])
            const type = String.fromCharCode(buffered[0])
            if (type === "R") {
                settle("ready")
                return
            }
            if (type !== "E") {
                settle("fatal", `unexpected first reply byte ${JSON.stringify(type)} from server`)
                return
            }
            // ErrorResponse: wait for the complete message, then read its
            // fields (1-byte tag + NUL-terminated string, list ends at NUL).
            if (buffered.length < 5) return
            const messageLength = buffered.readInt32BE(1)
            if (buffered.length < 1 + messageLength) return
            const fields = {}
            let offset = 5
            while (offset < 1 + messageLength && buffered[offset] !== 0) {
                const tag = String.fromCharCode(buffered[offset])
                const end = buffered.indexOf(0, offset + 1)
                fields[tag] = buffered.toString("utf8", offset + 1, end)
                offset = end + 1
            }
            const detail = `server error ${fields.C ?? "?????"}: ${fields.M ?? "(no message)"}`
            settle(fields.C === "57P03" ? "retry" : "fatal", detail)
        })
    })
}

async function waitUntilAcceptingConnections() {
    const deadline = Date.now() + 60_000
    let lastDetail = "no probe completed"
    for (;;) {
        const result = await probeOnce()
        if (result.kind === "ready") {
            return
        }
        if (result.kind === "fatal") {
            console.error(
                `[embedded-pg] ${target} readiness probe failed non-transiently: ${result.detail}`,
            )
            printServerLogTail()
            process.exit(1)
        }
        lastDetail = result.detail
        if (Date.now() >= deadline) {
            console.error(
                `[embedded-pg] ${target} not accepting connections on :${port} after 60s (last probe: ${lastDetail}).`,
            )
            printServerLogTail()
            process.exit(1)
        }
        await new Promise((resolveSleep) => setTimeout(resolveSleep, 1_000))
    }
}

// A readiness failure without the server's own words is undebuggable in CI —
// the staged temp dir is gone by the time anyone reads the job log.
function printServerLogTail() {
    try {
        const tail = readFileSync(logFile, "utf8").trimEnd().split("\n").slice(-20).join("\n")
        console.error(`[embedded-pg] last lines of ${logFile}:\n${tail}`)
    } catch {
        console.error(`[embedded-pg] no server log at ${logFile}.`)
    }
}

async function main() {
    if (!["start", "stop", "reset"].includes(command)) {
        console.error("Usage: embedded-pg.mjs <start|stop|reset> <core|test>")
        process.exit(1)
    }

    ensureOwnership()
    if (command === "stop" || command === "reset") {
        if (existsSync(path.join(dataDir, "PG_VERSION")) && isRunning()) {
            run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"])
            console.log(`[embedded-pg] Stopped ${target}.`)
        } else {
            console.log(`[embedded-pg] ${target} was not running.`)
        }
        if (command === "reset") {
            rmSync(dataDir, { recursive: true, force: true })
            console.log(`[embedded-pg] Reset ${target} data dir.`)
        }
        return
    }

    if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
        initCluster()
    }
    if (isRunning()) {
        await waitUntilAcceptingConnections()
        console.log(`[embedded-pg] ${target} already running on :${port}.`)
        return
    }
    // pg_ctl daemonizes postgres (detached from this process and its session).
    run("pg_ctl", [
        "-D",
        dataDir,
        "-l",
        logFile,
        "-o",
        `-p ${port} -c listen_addresses=127.0.0.1`,
        "-w",
        "start",
    ])
    await waitUntilAcceptingConnections()
    console.log(`[embedded-pg] ${target} running on :${port}.`)
}

await main()
