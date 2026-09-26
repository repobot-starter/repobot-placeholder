// Tests must never open real sockets. Components fetch relative URLs when
// mounted, happy-dom resolves them against its default origin
// (http://localhost:3000), and node then really connects: whatever answers
// on the developer's port 3000 changes test behavior, and when nothing
// answers, the in-flight connects race happy-dom's teardown abort — under
// load that race aborts natively, and with the shared-process "threads"
// pool one abort kills the whole vitest run (SIGABRT, no report; it took
// down template publish gates mid-deploy twice).
//
// Every fetch rejects instantly with the standard browser network-failure
// error instead. That is the exact failure mode tests already exercise
// (ECONNREFUSED landed in the same catch paths) — just deterministic,
// immediate, and socket-free. Tests that mock fetch themselves simply
// override this stub.
const noNetworkFetch: typeof fetch = () =>
    Promise.reject(new TypeError("Failed to fetch (network is disabled in tests)"))

globalThis.fetch = noNetworkFetch
if (typeof window !== "undefined") {
    window.fetch = noNetworkFetch
}
