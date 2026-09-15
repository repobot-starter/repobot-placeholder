/**
 * The Locker pack's display copy and demo-library manifest. All on-page
 * words live here; the seed manifest names the baked assets under
 * web/app/public/files/ that first sign-in pushes through the upload flow.
 */
import type { DriveSeedManifest } from "../../Drive/driveSeed"

export const filesContent = {
    appName: "Locker",
    tagline: "A file locker of your own",
    emptyLibrary: "Nothing filed yet. Drop files anywhere on this page, or use Upload.",
    emptyFolder: "This folder is empty. Drop files here to fill it.",
    emptyTrash: "The trash is empty.",
    emptySearch: "No entries match the search.",
    emptyStarred: "Nothing starred yet — star entries to pin them here.",
    seeding: "Filing the demo library…",
    clearDemoLabel: "Clear demo library",
    clearDemoConfirm:
        "This permanently deletes every file, folder, and album in the library — the demo entries and " +
        "anything you added. There is no undo.",
} as const

export const filesSeedManifest: DriveSeedManifest = {
    clearedMarker: "locker-demo-cleared",
    folders: ["Design", "Finance", "Notes"],
    files: [
        {
            assetPath: "/files/demo/start-here.txt",
            name: "start-here.txt",
            contentType: "text/plain",
            starred: true,
        },
        {
            assetPath: "/files/demo/press-photo.webp",
            name: "press-photo.webp",
            contentType: "image/webp",
        },
        {
            assetPath: "/files/demo/logo.svg",
            name: "logo.svg",
            folder: "Design",
            contentType: "image/svg+xml",
        },
        {
            assetPath: "/files/demo/moodboard-01.webp",
            name: "moodboard-01.webp",
            folder: "Design",
            contentType: "image/webp",
        },
        {
            assetPath: "/files/demo/moodboard-02.webp",
            name: "moodboard-02.webp",
            folder: "Design",
            contentType: "image/webp",
        },
        {
            assetPath: "/files/demo/palette.json",
            name: "palette.json",
            folder: "Design",
            contentType: "application/json",
        },
        {
            assetPath: "/files/demo/q3-budget.csv",
            name: "q3-budget.csv",
            folder: "Finance",
            contentType: "text/csv",
            starred: true,
        },
        {
            assetPath: "/files/demo/invoice-0042.pdf",
            name: "invoice-0042.pdf",
            folder: "Finance",
            contentType: "application/pdf",
        },
        {
            assetPath: "/files/demo/project-brief.md",
            name: "project-brief.md",
            folder: "Notes",
            contentType: "text/markdown",
        },
        {
            assetPath: "/files/demo/meeting-notes.txt",
            name: "meeting-notes.txt",
            folder: "Notes",
            contentType: "text/plain",
        },
    ],
}
