#!/usr/bin/env python3
"""Stamp environment values into an Android config.properties asset before building.

Usage: stamp-android-config.py <path-to-src/<flavor>/assets/config.properties>

Reads APP_NAME and GRAPHQL_URL from the process environment and writes them
into the properties file (the auth endpoint is derived from GRAPHQL_URL at
runtime). Used by the android-build.yml workflow; the dev/prod properties are
committed with empty values (ConfigLoader fails closed on them) and only ever
carry real values inside a build. Twin of stamp-ios-config.py.

Client-only repos (clientOnly in repobot.deploy.json) have no backend to
point the app at: their builds legitimately carry empty backend values, and
the app boots on a placeholder config (see ConfigLoader.clientOnlyPlaceholder).
"""

import json
import os
import sys

STAMPED_KEYS = ["APP_NAME", "GRAPHQL_URL"]


def repo_is_client_only() -> bool:
    """Reads clientOnly from repobot.deploy.json at the repo root (the
    workflow's working directory). Missing manifest fails closed."""
    try:
        with open("repobot.deploy.json", "r", encoding="utf-8") as file:
            manifest = json.load(file)
    except (OSError, ValueError):
        return False
    return manifest.get("clientOnly") is True


def parse_properties(text: str) -> dict:
    values = {}
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        values[key.strip()] = value.strip()
    return values


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    config_path = sys.argv[1]

    with open(config_path, "r", encoding="utf-8") as file:
        original = file.read()
    existing = parse_properties(original)

    stamped = {}
    missing = []
    for key in STAMPED_KEYS:
        value = os.environ.get(key, "")
        if value:
            stamped[key] = value
        elif not existing.get(key):
            missing.append(key)

    if missing and not repo_is_client_only():
        print(f"Missing required config values: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    lines = []
    seen = set()
    for line in original.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.partition("=")[0].strip()
            if key in stamped:
                lines.append(f"{key}={stamped[key]}")
                seen.add(key)
                continue
        lines.append(line)
    for key, value in stamped.items():
        if key not in seen:
            lines.append(f"{key}={value}")

    with open(config_path, "w", encoding="utf-8") as file:
        file.write("\n".join(lines) + "\n")

    print(f"Stamped {config_path} ({', '.join(STAMPED_KEYS)})")


if __name__ == "__main__":
    main()
