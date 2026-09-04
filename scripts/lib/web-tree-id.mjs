// The v3 web-bundle tree id: a hash of exactly the tree content that can
// change the bytes Vite emits, and nothing else. This file is the cross-repo
// key contract — the kernel repo carries a byte-identical copy at
// scripts/lib/web-tree-id.mjs and its CI bakes template bundles under keys
// computed by it; the platform deployer restores under keys computed here.
// Both repos' suites pin this file's sha256 and a golden vector, so editing
// one copy alone goes red on both sides.
//
// Why v2 wasn't enough: v2 hashed the whole tree minus the overlaid visual
// documents, so the pristine-template bake could only ever match a tree
// nothing had touched. Real projects are NEVER that tree — provisioning
// stamps (.repobot-bake-lockhash), the setup wizard (index.html title,
// favicons, docs/setup-brief.md), and template flips (leftover pack imagery,
// remix content seeds, mobile theme codegen) all split the key while leaving
// the active site's build semantics identical. Measured on a real first
// publish (edp_JM9weD74XzYXLQ35Rq3Rax): a guaranteed cache miss and a 147s
// BUILDING stage that the bake existed to remove.
//
// Out of the hash (with the deploy-time counterpart that keeps each honest):
//   - repobot.{theme,landing,content}.json — the runtime site-config overlay
//     re-stamps them into every page at DEPLOYING_WEB (inject-site-config).
//   - web/app/public/** — Vite copies these verbatim into dist; the deploy
//     re-syncs the checkout's public tree over a restored bundle, so
//     favicons, uploaded imagery, and flip leftovers ship current without
//     splitting the key. (Generated SEO files live in public/ too: they
//     derive from repobot.project.json, which stays IN the hash.)
//   - web/app/index.html — hashed NORMALIZED: the setup wizard stamps only
//     the <title> and the repobot-app identity meta, and the deploy
//     re-stamps both from the checkout (restamp-static-shell); any OTHER
//     edit to the file still changes the normalized blob and rebuilds.
//   - docs/**, AGENTS.md — agent/user documentation the web build never
//     imports (verified: no doc imports under web/).
//   - ios/**, android/** — mobile-only trees (subsumes v2's two ActivePack
//     stamp exclusions; generate-native-theme.mjs rewrites GeneratedTheme.*
//     on every design save and was splitting web keys for mobile bytes).
//   - .repobot-* root stamps — compose/bake provenance and the public-prune
//     manifest; read by workspace tooling and tests, never by the build.
//   - **/.env.example — documentation files; the build loads real env only.
//   - packs/** except packs/active.json — pack data the web build never
//     reads; active.json stays because a template flip changes everything.
//   - Dormant packs' content seed modules (each pack's
//     contentContract.module from its catalog, for every pack that is not
//     the active one) — template flips copy remix seeds over other packs'
//     content.ts and never restore them, so a tree that browsed templates
//     can otherwise never match the pristine bake. The dormant modules
//     compile into chunks no route of the active site mounts; the ACTIVE
//     pack's module stays in the hash, so a real content edit rebuilds.
//
// Still in the hash: every web/ source (minus index.html normalization),
// repobot.deploy.json (glob-imported capability chrome), repobot.project.json
// (routes, SEO), packs/active.json, lockfiles, configs — anything that
// genuinely changes the bundle.
//
// Usage: node web-tree-id.mjs <repoDir>   → prints "v3 <sha256>"

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"

const repoDir = process.argv[2]
if (!repoDir) {
  console.error("usage: web-tree-id.mjs <repoDir>")
  process.exit(1)
}

const git = (...args) =>
  execFileSync("git", args, { cwd: repoDir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })

const sha256 = (text) => createHash("sha256").update(text).digest("hex")

// `git ls-tree -r` emits "<mode> <type> <sha>\t<path>" in path order — the
// listing itself is the deterministic preimage base, same as v2.
const listing = git("ls-tree", "-r", "HEAD^{tree}")
  .split("\n")
  .filter((line) => line.length > 0)
const pathOf = (line) => line.slice(line.indexOf("\t") + 1)
const blobOf = (line) => line.split(/\s+/)[2]
const blobByPath = new Map(listing.map((line) => [pathOf(line), blobOf(line)]))
const readBlob = (path) => {
  const sha = blobByPath.get(path)
  return sha === undefined ? undefined : git("cat-file", "blob", sha)
}

// Dormant content seeds: every pack's declared content module except the
// active pack's. Catalogs and active.json are read from the tree's own
// blobs, so the id never depends on working-tree state.
const dormantModules = new Set()
try {
  const active = JSON.parse(readBlob("packs/active.json") ?? "{}").key
  for (const [path] of blobByPath) {
    const match = /^packs\/([^/]+)\/catalog\.json$/.exec(path)
    if (!match) continue
    let catalog
    try {
      catalog = JSON.parse(readBlob(path))
    } catch {
      continue // an unparseable catalog excludes nothing — fail toward rebuilds
    }
    const module = catalog?.contentContract?.module
    if (typeof module === "string" && module.length > 0 && catalog.key !== active) {
      dormantModules.add(module)
    }
  }
} catch {
  // No readable active.json: exclude nothing — fail toward rebuilds.
}

const EXCLUDED_EXACT = new Set([
  "repobot.theme.json",
  "repobot.landing.json",
  "repobot.content.json",
  "AGENTS.md",
  "web/app/index.html", // hashed normalized below
  ".repobot-bake-lockhash",
  ".repobot-template-ref",
  ".repobot-template-pack-ref",
  ".repobot-public-prune.json",
])
const EXCLUDED_PREFIXES = ["docs/", "ios/", "android/", "web/app/public/"]

const included = listing.filter((line) => {
  const path = pathOf(line)
  if (EXCLUDED_EXACT.has(path)) return false
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return false
  if (path.startsWith("packs/") && path !== "packs/active.json") return false
  if (path === ".env.example" || path.endsWith("/.env.example")) return false
  if (dormantModules.has(path)) return false
  return true
})

// index.html rides the preimage as a normalized content hash: the two
// wizard-stamped values (the pre-hydration <title> fallback and the
// repobot-app identity marker) blank out, everything else — structure,
// scripts, links — still splits the key.
const preimageLines = included.slice()
const indexHtml = readBlob("web/app/index.html")
if (indexHtml !== undefined) {
  const normalized = indexHtml
    .replace(/<title>[^<]*<\/title>/, "<title></title>")
    .replace(/(<meta\s+name="repobot-app"\s+content=")[^"]*(")/, "$1$2")
  preimageLines.push(`indexhtml ${sha256(normalized)}`)
}

process.stdout.write(`v3 ${sha256(preimageLines.join("\n") + "\n")}\n`)
