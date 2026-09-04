# Composed templates delta contract (v1)

The composed-templates publisher emits a monolith plus incremental slices
for the same runtime fingerprint (`rt-*` ref):

- Monolith tarball: `templates-<ref>.tar.zst`
- Legacy metadata: `templates-<ref>.json`
- Delta manifest object: `templates-<ref>/manifest.json`
- Per-template slice tarballs: `templates-<ref>/<templateKey>.tar.zst`

The delta manifest schema is fixed at:

```json
{
    "schema": "repobot.composed-templates.delta.v1",
    "ref": "<rt-ref>",
    "sourceCommit": "<git sha>",
    "monolithTarball": "templates-<rt-ref>.tar.zst",
    "createdAt": "YYYY-MM-DDTHH:MM:SSZ",
    "templateCount": 58,
    "templates": {
        "<templateKey>": {
            "hash": "sha256:<64 hex>",
            "tarball": "templates-<rt-ref>/<templateKey>.tar.zst"
        }
    }
}
```

Hash algorithm (`hash`) is deterministic over each template tree:

1. Recursively walk entries in lexical path order
2. Emit one preimage line per entry:
    - `dir <relpath> <mode-octal>`
    - `symlink <relpath> <mode-octal> <target>`
    - `file <relpath> <mode-octal> <byte-length> <sha256(file-bytes)>`
3. Hash the joined lines plus trailing newline with SHA-256
4. Encode as `sha256:<hex>`

Runtime consumers may perform delta splice only when both old and new
manifests pass this contract. Any mismatch must fail loudly and fall back
to monolith extraction.
