// The one correct "am I the CLI entrypoint?" test for dual-use scripts
// (importable modules that also run a main). The obvious comparison —
// path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) — is a
// silent no-op under any symlinked absolute invocation: node canonicalizes
// the main module's URL to its REAL path, while argv[1] keeps the path as
// typed. On macOS every mktemp -d lives under /var/folders (a symlink to
// /private/var/folders), so compose-pack.sh invoking
// `node ${REPO_ROOT}/scripts/generate-agent-map.mjs --stamp ...` from a
// publish workdir matched nothing, main() never ran, and every composed
// template shipped without its agent map — the 2026-09-15 publish outage.
// Linux CI's /tmp is real, which is why the same flow was green there and
// the gap survived until a local publish. realpath both sides and the
// comparison is invocation-shape-proof.
import { realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export function isEntrypoint(importMetaUrl) {
    if (!process.argv[1]) {
        return false
    }
    let entry
    try {
        entry = realpathSync(path.resolve(process.argv[1]))
    } catch {
        return false
    }
    return entry === fileURLToPath(importMetaUrl)
}
