#!/usr/bin/env python3
"""Stamp the project's brand icon into the native app icon slots before a
device build.

Usage: stamp-app-icon.py  (run from the repo root; requires Pillow)

Reads marketing.brand.icon from repobot.project.json (a servable path under
web/app/public, e.g. "/brand/icon.png" — see the brand kit contract in
AGENTS.md) and derives:

- iOS: ios/App/View/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png —
  1024x1024, alpha flattened onto the icon's own edge color (App Store
  Connect rejects marketing icons with an alpha channel).
- Android: res/drawable/ic_launcher_foreground.png (replacing the kernel's
  default vector) — the adaptive-icon foreground, the icon scaled into the
  66/108 safe zone on a transparent canvas so the launcher mask never cuts
  it — plus the icon's edge color stamped into ic_launcher_colors.xml as
  the adaptive background.

No brand icon in the manifest (or the file missing) is a clean no-op: the
build keeps the kernel's committed placeholder icon. Used by ios-build.yml
and android-build.yml; a sibling of stamp-ios-config.py /
stamp-android-config.py, but for artwork instead of config values.
"""

import json
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow is required: python3 -m pip install pillow", file=sys.stderr)
    sys.exit(2)

MANIFEST_PATH = "repobot.project.json"
PUBLIC_DIR = os.path.join("web", "app", "public")
IOS_ICON_PATH = os.path.join(
    "ios", "App", "View", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-1024.png"
)
ANDROID_RES_DIR = os.path.join("android", "app", "src", "main", "res")

# Adaptive-icon geometry at xxxhdpi (4x): the 108dp canvas is 432px and the
# 66dp safe zone is 264px — art outside it can be cut by the launcher mask.
ANDROID_CANVAS_PX = 432
ANDROID_SAFE_PX = 264


def brand_icon_path() -> str | None:
    try:
        with open(MANIFEST_PATH, "r", encoding="utf-8") as file:
            manifest = json.load(file)
    except (OSError, ValueError):
        return None
    icon = (((manifest.get("marketing") or {}).get("brand")) or {}).get("icon")
    if not isinstance(icon, str) or not icon:
        return None
    resolved = os.path.join(PUBLIC_DIR, icon.lstrip("/"))
    return resolved if os.path.isfile(resolved) else None


def edge_color(image: Image.Image) -> tuple[int, int, int]:
    """The average color of the icon's opaque edge pixels — the natural
    backdrop for flattening alpha and for the adaptive-icon background.
    Sampled as concentric rings working inward, so icons with transparent
    rounded corners still yield their fill color, not the white fallback."""
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    opaque: list[tuple[int, int, int]] = []
    for inset_fraction in (0.0, 0.04, 0.08, 0.12):
        inset_x = int(width * inset_fraction)
        inset_y = int(height * inset_fraction)
        samples = []
        for x in range(inset_x, width - inset_x):
            samples.extend([pixels[x, inset_y], pixels[x, height - 1 - inset_y]])
        for y in range(inset_y, height - inset_y):
            samples.extend([pixels[inset_x, y], pixels[width - 1 - inset_x, y]])
        opaque = [(r, g, b) for (r, g, b, a) in samples if a >= 128]
        # A mostly-opaque ring is representative; a sparse one is just the
        # antialiased fringe of a rounded corner — move inward.
        if len(opaque) >= len(samples) // 2:
            break
    if not opaque:
        return (255, 255, 255)
    count = len(opaque)
    return (
        sum(sample[0] for sample in opaque) // count,
        sum(sample[1] for sample in opaque) // count,
        sum(sample[2] for sample in opaque) // count,
    )


def stamp_ios(icon: Image.Image, background: tuple[int, int, int]) -> None:
    if not os.path.isfile(IOS_ICON_PATH):
        return
    flattened = Image.new("RGB", (1024, 1024), background)
    scaled = icon.convert("RGBA").resize((1024, 1024), Image.LANCZOS)
    flattened.paste(scaled, (0, 0), scaled)
    flattened.save(IOS_ICON_PATH, format="PNG")
    print(f"Stamped {IOS_ICON_PATH}")


def stamp_android(icon: Image.Image, background: tuple[int, int, int]) -> None:
    drawable_dir = os.path.join(ANDROID_RES_DIR, "drawable")
    if not os.path.isdir(drawable_dir):
        return
    # The PNG replaces the kernel's default vector outright — the same
    # resource can't exist as both an XML and a bitmap in one directory.
    default_vector = os.path.join(drawable_dir, "ic_launcher_foreground.xml")
    if os.path.isfile(default_vector):
        os.remove(default_vector)
    canvas = Image.new("RGBA", (ANDROID_CANVAS_PX, ANDROID_CANVAS_PX), (0, 0, 0, 0))
    scaled = icon.convert("RGBA").resize((ANDROID_SAFE_PX, ANDROID_SAFE_PX), Image.LANCZOS)
    offset = (ANDROID_CANVAS_PX - ANDROID_SAFE_PX) // 2
    canvas.paste(scaled, (offset, offset), scaled)
    foreground_path = os.path.join(drawable_dir, "ic_launcher_foreground.png")
    canvas.save(foreground_path, format="PNG")
    print(f"Stamped {foreground_path}")

    colors_path = os.path.join(ANDROID_RES_DIR, "values", "ic_launcher_colors.xml")
    hex_color = "#{:02X}{:02X}{:02X}".format(*background)
    with open(colors_path, "w", encoding="utf-8") as file:
        file.write(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            "<!-- Adaptive launcher icon background. Stamped from the brand\n"
            "     icon's edge color by stamp-app-icon.py at build time. -->\n"
            "<resources>\n"
            f'    <color name="ic_launcher_background">{hex_color}</color>\n'
            "</resources>\n"
        )
    print(f"Stamped {colors_path} ({hex_color})")


def main() -> None:
    icon_path = brand_icon_path()
    if icon_path is None:
        print("No brand icon in repobot.project.json; keeping the default app icon.")
        return
    icon = Image.open(icon_path)
    background = edge_color(icon)
    stamp_ios(icon, background)
    stamp_android(icon, background)


if __name__ == "__main__":
    main()
