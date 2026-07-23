// Docker-free Postgres for sandboxes, using the binaries shipped with the
// `embedded-postgres` package but driving them via pg_ctl so the daemon
// properly detaches and outlives this script (the embedded-postgres JS API
// stops the server on process exit, which doesn't fit our scripted workflow).
//
// Usage: node scripts/lib/embedded-pg.mjs <start|stop|reset> <core|test>
// Ports: DB_PORT (core, default 5432) / DB_TEST_PORT (test, default 5433).
// Data lives under .devdata/pg-<target>; logs under .devdata/pg-<target>.log.
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const [, , command, target = "core"] = process.argv
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
    execFileSync(path.join(binDir(), binary), args, { stdio: "inherit" })
}

function initCluster() {
    mkdirSync(path.dirname(dataDir), { recursive: true })
    const passwordFile = path.join(path.dirname(dataDir), `.pg-${target}-pw`)
    writeFileSync(passwordFile, "postgres\n")
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

function main() {
    if (!["start", "stop", "reset"].includes(command)) {
        console.error("Usage: embedded-pg.mjs <start|stop|reset> <core|test>")
        process.exit(1)
    }

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
    console.log(`[embedded-pg] ${target} running on :${port}.`)
}

main()
