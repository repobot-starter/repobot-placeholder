// Functions-emulator port selection: dev-up must never point the emulator
// at a port a foreign process owns. The firebase CLI dies on the bind while
// dev-up's own readiness gates (wait_for_port + the graphql-route probe)
// pass VACUOUSLY against the foreign server on the same port — the stack
// reports ready with a backend it does not own, and every /api call dies the
// moment that neighbor shuts down. Observed live (2026-08-30): a sandbox
// session bootstrapped beside another session's not-yet-reclaimed stack,
// lost the 5001 bind, and its preview went solid black on the next template
// flip when the neighbor's emulator was retired.
//
// These tests exercise the shared bump_past_occupied_ports helper against a
// real listener, and pin dev-up.sh's wiring of it (auto-bump default,
// strict explicit FUNCTIONS_PORT, chosen-port recording for reruns).

import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readFileSync } from "node:fs"
import { createServer } from "node:net"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

async function bumpPastOccupiedPorts(start, limit) {
    // set +e/manual capture: fail() exits 1 and we want its message.
    const { stdout } = await execFileAsync(
        "bash",
        [
            "-c",
            `source scripts/lib/common.sh && bump_past_occupied_ports ${start} ${limit} "functions emulator" 2>/dev/null`,
        ],
        { cwd: repoRoot },
    )
    return Number(stdout.trim())
}

function listen(port) {
    return new Promise((resolve, reject) => {
        const server = createServer()
        server.once("error", reject)
        server.listen(port, "127.0.0.1", () => resolve(server))
    })
}

// High ephemeral-adjacent range so parallel CI jobs and local stacks never
// collide with the probe.
const BASE = 42311 + (process.pid % 500)

test("a free start port is returned unchanged", async () => {
    const port = await bumpPastOccupiedPorts(BASE, BASE + 5)
    assert.equal(port, BASE)
})

test("an occupied start port bumps to the next free one", async () => {
    const squatter = await listen(BASE)
    try {
        const port = await bumpPastOccupiedPorts(BASE, BASE + 5)
        assert.equal(port, BASE + 1)
    } finally {
        squatter.close()
    }
})

test("exhausting the range fails instead of returning an occupied port", async () => {
    const squatterA = await listen(BASE)
    const squatterB = await listen(BASE + 1)
    try {
        await assert.rejects(bumpPastOccupiedPorts(BASE, BASE + 1), (error) => {
            assert.equal(error.code, 1)
            return true
        })
    } finally {
        squatterA.close()
        squatterB.close()
    }
})

test("dev-up wires the functions port through the shared selection contract", () => {
    const devUp = readFileSync(path.join(repoRoot, "scripts", "dev-up.sh"), "utf8")
    // Default path auto-bumps past occupied ports instead of assuming 5001.
    assert.match(devUp, /bump_past_occupied_ports 5001 \d+ "functions emulator"/)
    // An explicit FUNCTIONS_PORT is strict: occupied means a loud failure,
    // never a vacuous readiness pass against the squatter.
    assert.match(devUp, /port_open 127\.0\.0\.1 "\$FUNCTIONS_PORT"[\s\S]{0,200}fail "FUNCTIONS_PORT=/)
    // The chosen port is recorded so idempotent reruns (emulator already up)
    // keep describing the port the running emulator actually bound.
    assert.match(devUp, /FUNCTIONS_PORT_FILE="\$DEV_DIR\/functions-port"/)
    assert.match(devUp, /echo "\$FUNCTIONS_PORT" > "\$FUNCTIONS_PORT_FILE"/)
    const devDown = readFileSync(path.join(repoRoot, "scripts", "dev-down.sh"), "utf8")
    assert.match(devDown, /rm -f "\$DEV_DIR\/functions-port"/)
})

test("readiness is gated on OUR emulator process, not just an answering port", () => {
    const devUp = readFileSync(path.join(repoRoot, "scripts", "dev-up.sh"), "utf8")
    // Port selection closes the steady-state collision; a bind race in the
    // gap between the availability check and our emulator's bind can still
    // leave a foreign server answering while ours is dead. The ownership
    // gate (functions.pid alive) must sit between wait_for_port and the
    // readiness publication.
    const waitIdx = devUp.indexOf('wait_for_port 127.0.0.1 "$FUNCTIONS_PORT"')
    const gateIdx = devUp.indexOf('kill -0 "$(cat "$PID_DIR/functions.pid")"', waitIdx)
    const readyIdx = devUp.indexOf('> "$STACK_READY_FILE"')
    assert.ok(waitIdx > 0, "functions wait_for_port present")
    assert.ok(gateIdx > waitIdx, "ownership gate follows the port wait")
    assert.ok(readyIdx > gateIdx, "readiness is published only after the ownership gate")
    assert.match(devUp, /functions emulator process exited during startup/)
})
