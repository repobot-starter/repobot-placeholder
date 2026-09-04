/**
 * The hybrid audio system's external half (the pack recipes' "paste your
 * streaming links" promise): a track or mix in a content file may carry an
 * `embedUrl` — when it does, the player renders a click-to-load provider
 * embed behind the pack's own cover frame instead of the native demo
 * player. Nothing third-party loads until the visitor asks for it.
 *
 * Pure URL mapping, no SDKs: each provider's public iframe scheme derived
 * from the share URL. Bandcamp's iframe needs numeric ids a share URL
 * doesn't carry, so plain Bandcamp links fall back to a link-out frame
 * (embedSrc null) unless the owner pastes the EmbeddedPlayer URL itself.
 */

export type StreamProvider = "spotify" | "soundcloud" | "mixcloud" | "bandcamp" | "unknown"

export function detectProvider(url: string): StreamProvider {
    let host: string
    try {
        host = new URL(url).hostname
    } catch {
        return "unknown"
    }
    if (host === "open.spotify.com" || host.endsWith(".spotify.com")) return "spotify"
    if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) return "soundcloud"
    if (host === "mixcloud.com" || host.endsWith(".mixcloud.com")) return "mixcloud"
    if (host.endsWith("bandcamp.com")) return "bandcamp"
    return "unknown"
}

/** Reader-facing provider name for the frame's mono microcopy. */
export function providerLabel(provider: StreamProvider): string {
    switch (provider) {
        case "spotify":
            return "Spotify"
        case "soundcloud":
            return "SoundCloud"
        case "mixcloud":
            return "Mixcloud"
        case "bandcamp":
            return "Bandcamp"
        case "unknown":
            return "Stream"
    }
}

/**
 * The provider's iframe src for a pasted share URL, or null when the link
 * can only open in a new tab (unknown providers, plain Bandcamp pages).
 */
export function embedSrc(url: string): string | null {
    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return null
    }
    switch (detectProvider(url)) {
        case "spotify": {
            // open.spotify.com/track/<id> -> open.spotify.com/embed/track/<id>
            if (parsed.pathname.startsWith("/embed/")) return url
            const match = /^\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/.exec(
                parsed.pathname,
            )
            if (match === null) return null
            return `https://open.spotify.com/embed/${match[1]}/${match[2]}`
        }
        case "soundcloud":
            if (parsed.hostname === "w.soundcloud.com") return url
            return (
                "https://w.soundcloud.com/player/?url=" +
                encodeURIComponent(`${parsed.origin}${parsed.pathname}`) +
                "&auto_play=true&show_teaser=false&visual=false"
            )
        case "mixcloud":
            if (parsed.hostname === "player-widget.mixcloud.com") return url
            return (
                "https://player-widget.mixcloud.com/widget/iframe/?feed=" +
                encodeURIComponent(parsed.pathname) +
                "&autoplay=1&light=0"
            )
        case "bandcamp":
            return parsed.pathname.includes("EmbeddedPlayer") ? url : null
        case "unknown":
            return null
    }
}

/** The YouTube id from a watch/share/embed URL, or null. */
export function youtubeId(url: string): string | null {
    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        return null
    }
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null
    if (parsed.hostname.endsWith("youtube.com") || parsed.hostname.endsWith("youtube-nocookie.com")) {
        if (parsed.pathname === "/watch") return parsed.searchParams.get("v")
        const match = /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{6,})/.exec(parsed.pathname)
        if (match !== null) return match[1]
    }
    return null
}

/** Privacy-respecting autoplay embed src for a click-to-load video frame. */
export function youtubeEmbedSrc(url: string): string | null {
    const id = youtubeId(url)
    if (id === null) return null
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
}
