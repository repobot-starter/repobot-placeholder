/**
 * The Contact Sheet pack's display copy and demo-library manifest. All
 * on-page words live here; the seed manifest names the baked photos under
 * web/app/public/images/ that first sign-in pushes through the upload flow.
 */
import type { DriveSeedManifest } from "../../Drive/driveSeed"

export const imagesContent = {
    appName: "Contact Sheet",
    tagline: "A photo library of your own",
    emptyTimeline: "No photos yet. Drop images anywhere on this page, or use Import.",
    emptyFavorites: "No favorites yet — star frames to pin them here.",
    emptyAlbum: "This album is empty. Add photos from the lightbox.",
    emptySearch: "No frames match the search.",
    seeding: "Developing the demo roll…",
    clearDemoLabel: "Clear demo library",
    clearDemoConfirm:
        "This permanently deletes every photo and album in the library — the demo roll and anything " +
        "you imported. There is no undo.",
} as const

const demoAlbum = "Selects"

export const imagesSeedManifest: DriveSeedManifest = {
    clearedMarker: "contact-sheet-demo-cleared",
    folders: [],
    albums: [demoAlbum],
    files: [
        {
            assetPath: "/images/demo/IMG_0141.webp",
            name: "IMG_0141.webp",
            contentType: "image/webp",
            capturedTime: "2026-06-14T08:12:00",
            caption: "North coast, first light",
            starred: true,
            album: demoAlbum,
        },
        {
            assetPath: "/images/demo/IMG_0158.webp",
            name: "IMG_0158.webp",
            contentType: "image/webp",
            capturedTime: "2026-06-14T09:40:00",
            caption: "Tide line",
        },
        {
            assetPath: "/images/demo/IMG_0176.webp",
            name: "IMG_0176.webp",
            contentType: "image/webp",
            capturedTime: "2026-06-15T17:55:00",
            caption: "Headland before the rain",
            album: demoAlbum,
        },
        {
            assetPath: "/images/demo/IMG_0342.webp",
            name: "IMG_0342.webp",
            contentType: "image/webp",
            capturedTime: "2026-07-02T13:05:00",
            caption: "Editorial test, frame 2",
        },
        {
            assetPath: "/images/demo/IMG_0398.webp",
            name: "IMG_0398.webp",
            contentType: "image/webp",
            capturedTime: "2026-07-04T14:22:00",
            starred: true,
        },
        {
            assetPath: "/images/demo/IMG_0522.webp",
            name: "IMG_0522.webp",
            contentType: "image/webp",
            capturedTime: "2026-07-12T11:30:00",
            caption: "Portrait sitting, natural light",
        },
        {
            assetPath: "/images/demo/IMG_0567.webp",
            name: "IMG_0567.webp",
            contentType: "image/webp",
            capturedTime: "2026-07-19T12:18:00",
        },
        {
            assetPath: "/images/demo/IMG_0611.webp",
            name: "IMG_0611.webp",
            contentType: "image/webp",
            capturedTime: "2026-08-03T18:47:00",
            caption: "Saltwater, golden hour",
            starred: true,
            album: demoAlbum,
        },
        {
            assetPath: "/images/demo/IMG_0645.webp",
            name: "IMG_0645.webp",
            contentType: "image/webp",
            capturedTime: "2026-08-08T20:03:00",
        },
        {
            assetPath: "/images/demo/IMG_0703.webp",
            name: "IMG_0703.webp",
            contentType: "image/webp",
            capturedTime: "2026-08-21T15:26:00",
            caption: "January set, reprint",
        },
        {
            assetPath: "/images/demo/IMG_0781.webp",
            name: "IMG_0781.webp",
            contentType: "image/webp",
            capturedTime: "2026-08-01T23:41:00",
            caption: "Club night, long exposure",
            album: demoAlbum,
        },
        {
            assetPath: "/images/demo/IMG_0824.webp",
            name: "IMG_0824.webp",
            contentType: "image/webp",
            capturedTime: "2026-08-15T07:58:00",
            caption: "Chalk and iron, morning session",
        },
    ],
}
