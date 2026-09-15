#!/usr/bin/env node
// Kernel/runtime compatibility contract fingerprint.
//
// The contract manifest (repo root kernel-contract.json) names the kernel
// surfaces a prebuilt bundle depends on at boot/runtime overlay. The digest
// is intentionally narrower than the whole web tree id: unrelated kernel churn
// must not invalidate all bundles.
//
// Usage:
//   node scripts/lib/kernel-contract-fingerprint.mjs <repoDir>
//   node scripts/lib/kernel-contract-fingerprint.mjs <repoDir> --json

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"

const repoDir = process.argv[2]
const jsonMode = process.argv.includes("--json")

if (!repoDir) {
  console.error("usage: kernel-contract-fingerprint.mjs <repoDir> [--json]")
  process.exit(1)
}

const manifestPath = path.join(repoDir, "kernel-contract.json")

function sha256(text) {
  return createHash("sha256").update(text).digest("hex")
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoDir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
}

function readManifest() {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8"))
  } catch (error) {
    throw new Error(`kernel_contract_manifest_unreadable:${error instanceof Error ? error.message : String(error)}`)
  }
  if (parsed?.schema !== "repobot.kernel-contract.v1") {
    throw new Error(`kernel_contract_manifest_schema_mismatch:${parsed?.schema ?? "missing"}`)
  }
  if (!Number.isInteger(parsed.version) || parsed.version < 1) {
    throw new Error("kernel_contract_manifest_invalid_version")
  }
  if (!Number.isInteger(parsed.minCompatibleVersion) || parsed.minCompatibleVersion < 1) {
    throw new Error("kernel_contract_manifest_invalid_min_compatible_version")
  }
  if (parsed.minCompatibleVersion > parsed.version) {
    throw new Error("kernel_contract_manifest_min_compatible_exceeds_version")
  }
  if (!Array.isArray(parsed.surfacePaths) || parsed.surfacePaths.length === 0) {
    throw new Error("kernel_contract_manifest_missing_surface_paths")
  }
  for (const surfacePath of parsed.surfacePaths) {
    if (typeof surfacePath !== "string" || surfacePath.length === 0 || surfacePath.includes("..")) {
      throw new Error(`kernel_contract_manifest_invalid_surface_path:${String(surfacePath)}`)
    }
  }
  return parsed
}

function surfaceListing(surfacePath) {
  const listing = git("ls-tree", "-r", "HEAD", "--", surfacePath)
    .split("\n")
    .filter((line) => line.length > 0)
  if (listing.length === 0) {
    throw new Error(`kernel_contract_surface_missing:${surfacePath}`)
  }
  return listing
}

try {
  const manifest = readManifest()
  const surfaceHashes = []
  for (const surfacePath of manifest.surfacePaths) {
    const listing = surfaceListing(surfacePath)
    const digest = sha256(`${listing.join("\n")}\n`)
    surfaceHashes.push({ path: surfacePath, digest })
  }
  const preimage = [
    `schema ${manifest.schema}`,
    `version ${manifest.version}`,
    `minCompatibleVersion ${manifest.minCompatibleVersion}`,
    ...surfaceHashes.map((entry) => `surface ${entry.path} ${entry.digest}`),
  ].join("\n")
  const fingerprint = `kc1 ${sha256(`${preimage}\n`)}`

  if (jsonMode) {
    process.stdout.write(
      `${JSON.stringify(
        {
          schema: manifest.schema,
          version: manifest.version,
          minCompatibleVersion: manifest.minCompatibleVersion,
          fingerprint,
          surfaceHashes,
        },
        null,
        4,
      )}\n`,
    )
  } else {
    process.stdout.write(`${fingerprint}\n`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
