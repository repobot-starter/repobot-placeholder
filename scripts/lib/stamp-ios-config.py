#!/usr/bin/env python3
"""Stamp environment values into an iOS Config plist before building.

Usage: stamp-ios-config.py <path-to-Config.<flavor>.plist>

Reads APP_NAME and GRAPHQL_URL from the process environment and writes them
into the plist (the auth endpoint is derived from GRAPHQL_URL at runtime).
Used by the ios-build.yml workflow; the dev/prod plists are committed with
empty values (ConfigLoader fails closed on them) and only ever carry real
values inside a build.

Client-only repos (clientOnly in repobot.deploy.json) have no backend to
point the app at: their builds legitimately carry empty backend values, and
the app boots on a placeholder config (see ConfigLoader.clientOnlyPlaceholder).
"""

import json
import os
import plistlib
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


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    config_path = sys.argv[1]

    with open(config_path, "rb") as file:
        config = plistlib.load(file)

    missing = []
    for key in STAMPED_KEYS:
        value = os.environ.get(key, "")
        if value:
            config[key] = value
        elif not config.get(key):
            missing.append(key)

    if missing and not repo_is_client_only():
        print(f"Missing required config values: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    with open(config_path, "wb") as file:
        plistlib.dump(config, file)

    print(f"Stamped {config_path} ({', '.join(STAMPED_KEYS)})")


if __name__ == "__main__":
    main()
