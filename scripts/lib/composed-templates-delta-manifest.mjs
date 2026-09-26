import { createHash } from "node:crypto"
import { lstat, readdir, readFile, readlink, writeFile } from "node:fs/promises"
import path from "node:path"

export const COMPOSED_TEMPLATES_DELTA_SCHEMA = "repobot.composed-templates.delta.v1"

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

function entryMode(stat) {
  return (stat.mode & 0o7777).toString(8).padStart(4, "0")
}

async function hashTemplateTreeLines(rootDir, relative = "") {
  const fullPath = relative ? path.join(rootDir, relative) : rootDir
  const entries = await readdir(fullPath, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))

  const lines = []
  for (const entry of entries) {
    const relPath = relative ? path.join(relative, entry.name) : entry.name
    const entryPath = path.join(rootDir, relPath)
    const stats = await lstat(entryPath)
    const mode = entryMode(stats)
    if (entry.isDirectory()) {
      lines.push(`dir ${relPath} ${mode}`)
      lines.push(...(await hashTemplateTreeLines(rootDir, relPath)))
      continue
    }
    if (entry.isSymbolicLink()) {
      lines.push(`symlink ${relPath} ${mode} ${await readlink(entryPath)}`)
      continue
    }
    if (entry.isFile()) {
      const content = await readFile(entryPath)
      lines.push(`file ${relPath} ${mode} ${content.length} ${sha256(content)}`)
      continue
    }
    throw new Error(`templates_delta_unsupported_entry:${relPath}`)
  }
  return lines
}

export async function hashTemplateTree(rootDir) {
  const lines = await hashTemplateTreeLines(rootDir)
  return `sha256:${sha256(`${lines.join("\n")}\n`)}`
}

export async function buildComposedTemplatesDeltaManifest({ ref, sourceCommit, templatesByKey }) {
  const templates = {}
  const keys = Object.keys(templatesByKey).sort((a, b) => a.localeCompare(b))
  for (const key of keys) {
    templates[key] = {
      hash: await hashTemplateTree(templatesByKey[key]),
      tarball: `templates-${ref}/${key}.tar.zst`,
    }
  }
  return {
    schema: COMPOSED_TEMPLATES_DELTA_SCHEMA,
    ref,
    sourceCommit,
    monolithTarball: `templates-${ref}.tar.zst`,
    createdAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    templateCount: keys.length,
    templates,
  }
}

async function main() {
  const [outPath, ref, sourceCommit, ...templateArgs] = process.argv.slice(2)
  if (!outPath || !ref || !sourceCommit || templateArgs.length === 0) {
    console.error(
      "usage: node scripts/lib/composed-templates-delta-manifest.mjs <out-path> <ref> <source-commit> <templateKey=absolutePath> [templateKey=absolutePath ...]",
    )
    process.exit(1)
  }
  const templatesByKey = {}
  for (const pair of templateArgs) {
    const splitAt = pair.indexOf("=")
    if (splitAt <= 0 || splitAt === pair.length - 1) {
      throw new Error(`templates_delta_invalid_template_arg:${pair}`)
    }
    const key = pair.slice(0, splitAt)
    const treePath = pair.slice(splitAt + 1)
    templatesByKey[key] = treePath
  }
  const manifest = await buildComposedTemplatesDeltaManifest({
    ref,
    sourceCommit,
    templatesByKey,
  })
  await writeFile(outPath, `${JSON.stringify(manifest, null, 4)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
