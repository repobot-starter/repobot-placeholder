import { describe, expect, it } from "vitest"
import {
    detectProvider,
    embedSrc,
    providerLabel,
    youtubeEmbedSrc,
    youtubeId,
} from "../../../src/View/Music/embeds"

/**
 * The hybrid audio system's URL mapping: pasted share links become
 * click-to-load provider iframes; links that can't be safely embedded
 * (unknown hosts, plain Bandcamp pages) fall back to link-out frames —
 * never a broken player.
 */

describe("detectProvider", () => {
    it("recognizes the supported providers by host", () => {
        expect(detectProvider("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toBe("spotify")
        expect(detectProvider("https://soundcloud.com/artist/mix-041")).toBe("soundcloud")
        expect(detectProvider("https://www.mixcloud.com/artist/kontakt-041/")).toBe("mixcloud")
        expect(detectProvider("https://artist.bandcamp.com/album/meridian")).toBe("bandcamp")
        expect(detectProvider("https://example.com/song")).toBe("unknown")
        expect(detectProvider("not a url")).toBe("unknown")
    })

    it("labels providers for the frame's microcopy", () => {
        expect(providerLabel("spotify")).toBe("Spotify")
        expect(providerLabel("unknown")).toBe("Stream")
    })
})

describe("embedSrc", () => {
    it("maps Spotify share URLs to the embed player", () => {
        expect(embedSrc("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toBe(
            "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
        )
        expect(embedSrc("https://open.spotify.com/album/2up3OPMp9Tb4dAKM2erWXQ")).toBe(
            "https://open.spotify.com/embed/album/2up3OPMp9Tb4dAKM2erWXQ",
        )
    })

    it("wraps SoundCloud and Mixcloud pages in their player widgets", () => {
        expect(embedSrc("https://soundcloud.com/artist/mix-041")).toContain(
            "https://w.soundcloud.com/player/?url=",
        )
        expect(embedSrc("https://www.mixcloud.com/artist/kontakt-041/")).toContain(
            "https://player-widget.mixcloud.com/widget/iframe/?feed=",
        )
    })

    it("refuses to fabricate embeds it cannot build", () => {
        // Bandcamp's iframe needs numeric ids a share URL doesn't carry.
        expect(embedSrc("https://artist.bandcamp.com/album/meridian")).toBeNull()
        expect(embedSrc("https://example.com/song")).toBeNull()
        expect(embedSrc("nonsense")).toBeNull()
    })

    it("passes through already-built player URLs", () => {
        const built = "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/"
        expect(embedSrc(built)).toBe(built)
    })
})

describe("youtube helpers (click-to-load video)", () => {
    it("extracts ids from watch, short, and embed URLs", () => {
        expect(youtubeId("https://www.youtube.com/watch?v=aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ")
        expect(youtubeId("https://youtu.be/aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ")
        expect(youtubeId("https://www.youtube.com/embed/aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ")
        expect(youtubeId("https://vimeo.com/12345")).toBeNull()
    })

    it("builds a privacy-enhanced autoplay embed", () => {
        expect(youtubeEmbedSrc("https://www.youtube.com/watch?v=aqz-KE-bpKQ")).toBe(
            "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0",
        )
        expect(youtubeEmbedSrc("https://example.com/x")).toBeNull()
    })
})
