import { resolveStorageUrl } from "@base/core"
import { AppShell, Spinner, type AppShellNavItem, type AppShellNavSection } from "@ui"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useApolloClient } from "@apollo/client"
import { runtime } from "../../Config/Runtime"
import {
    collectDroppedFiles,
    driveStorageEndpoint,
    uploadBlobThroughKernel,
    useDriveUploader,
    type DriveUploadExtras,
    type DriveUploadJob,
} from "../../Drive/driveUpload"
import { maybeSeedDriveLibrary, markDriveLibraryCleared } from "../../Drive/driveSeed"
import { readExifCapture } from "../../Drive/exifCapture"
import { makeImageThumbnail, rotateImageFile } from "../../Drive/imageThumb"
import { formatEntryDate } from "../../Drive/driveFormat"
import {
    useAddDriveAlbumEntryMutation,
    useClearDriveLibraryMutation,
    useCreateDriveAlbumMutation,
    useDeleteDriveAlbumMutation,
    useDriveAlbumsQuery,
    useDriveEntriesQuery,
    useRemoveDriveAlbumEntryMutation,
    useReplaceDriveEntryMediaMutation,
    useSetDriveEntryCaptionMutation,
    useSetDriveEntryStarredMutation,
    useTrashDriveEntryMutation,
    type DriveAlbumsQuery,
    type DriveEntryFieldsFragment,
} from "../../generated/graphql/types"
import { imagesContent, imagesSeedManifest } from "./imagesContent"
import * as styles from "./ImagesPage.styles.css"

type Photo = DriveEntryFieldsFragment
type Album = DriveAlbumsQuery["driveAlbums"][number]

type Tab = "timeline" | "favorites" | "albums"

const PAGE_SIZE = 500
const SLIDESHOW_INTERVAL_MS = 3500

/** Nav ids carry their meaning: the three lenses plus the demo action. */
const NAV_TIMELINE = "view:timeline"
const NAV_FAVORITES = "view:favorites"
const NAV_ALBUMS = "view:albums"
const NAV_CLEAR = "action:clear"

const NAV_ID_BY_TAB: Record<Tab, string> = {
    timeline: NAV_TIMELINE,
    favorites: NAV_FAVORITES,
    albums: NAV_ALBUMS,
}

function ContactSheetBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect
                x="3"
                y="4.5"
                width="14"
                height="11"
                rx="1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    )
}

/**
 * Session gate: the photo library is owner-scoped, so establish a session
 * first (anonymous for preview visitors), then mount the contact sheet.
 */
export default function ImagesPage(): React.ReactElement {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string>()

    useEffect(() => {
        let cancelled = false
        const ensureSession = async (): Promise<void> => {
            const existing = await runtime.authClient.getToken()
            if (existing === null) {
                await runtime.authClient.signInAnonymously()
            }
            if (!cancelled) {
                setReady(true)
            }
        }
        ensureSession().catch((caught: unknown) => {
            if (!cancelled) {
                setError(caught instanceof Error ? caught.message : "Sign-in failed.")
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    if (error !== undefined) {
        return <p role="alert">{error}</p>
    }
    if (!ready) {
        return (
            <div className={styles.centeredGate}>
                <Spinner size="lg" />
            </div>
        )
    }
    return <ContactSheetApp />
}

/** The image entry's place on the timeline: capture time, else upload time. */
function photoTime(photo: Photo): string {
    return (photo.capturedTime ?? photo.createdTime) as string
}

function formatMonth(iso: string): string {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return "Undated"
    }
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

/** EXIF + thumbnail derivation each import runs before its bytes upload. */
async function prepareImage(file: File): Promise<DriveUploadExtras> {
    const [exif, thumbBlob] = await Promise.all([readExifCapture(file), makeImageThumbnail(file)])
    return { capturedTime: exif.capturedTime, thumbBlob }
}

function ContactSheetApp(): React.ReactElement {
    const client = useApolloClient()

    const [tab, setTab] = useState<Tab>("timeline")
    const [openAlbum, setOpenAlbum] = useState<Album>()
    const [search, setSearch] = useState("")
    const [notice, setNotice] = useState<string>()
    const [actionError, setActionError] = useState<string>()
    const [seeding, setSeeding] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [lightboxId, setLightboxId] = useState<string>()
    const [newAlbumOpen, setNewAlbumOpen] = useState(false)
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragDepthRef = useRef(0)

    const trimmedSearch = search.trim()
    const inAlbum = tab === "albums" && openAlbum !== undefined

    const entriesQuery = useDriveEntriesQuery({
        variables: {
            input: {
                filters: inAlbum
                    ? { albumId: openAlbum.id }
                    : tab === "favorites"
                      ? { starred: true, kind: "FILE" }
                      : trimmedSearch.length > 0
                        ? { search: trimmedSearch, kind: "FILE" }
                        : { kind: "FILE" },
                connection: {
                    pagination: { first: PAGE_SIZE },
                    sort: [{ fieldName: "rowCreatedAt", direction: "desc" }],
                },
            },
        },
        fetchPolicy: "cache-and-network",
    })
    const albumsQuery = useDriveAlbumsQuery({ fetchPolicy: "cache-and-network" })

    const refetchLibrary = useCallback((): void => {
        void entriesQuery.refetch()
        void albumsQuery.refetch()
    }, [entriesQuery, albumsQuery])

    const uploader = useDriveUploader(refetchLibrary)

    const [setStarred] = useSetDriveEntryStarredMutation()
    const [setCaption] = useSetDriveEntryCaptionMutation()
    const [replaceMedia] = useReplaceDriveEntryMediaMutation()
    const [trashEntry] = useTrashDriveEntryMutation()
    const [createAlbum] = useCreateDriveAlbumMutation()
    const [deleteAlbum] = useDeleteDriveAlbumMutation()
    const [addAlbumEntry] = useAddDriveAlbumEntryMutation()
    const [removeAlbumEntry] = useRemoveDriveAlbumEntryMutation()
    const [clearLibrary] = useClearDriveLibraryMutation()

    // First sign-in: develop the demo roll through the normal upload flow.
    useEffect(() => {
        let cancelled = false
        setSeeding(true)
        maybeSeedDriveLibrary(client, imagesSeedManifest)
            .then((seeded) => {
                if (!cancelled && seeded) {
                    refetchLibrary()
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) {
                    setSeeding(false)
                }
            })
        return () => {
            cancelled = true
        }
        // Run once on mount; refetchLibrary identity churn must not re-seed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client])

    // The photo pack is a lens over the shared drive library: only image
    // entries surface here, newest capture (else upload) first.
    const photos = useMemo((): Photo[] => {
        const nodes = (entriesQuery.data?.driveEntries.nodes ?? []).filter(
            (node): node is Photo => node !== null,
        )
        return nodes
            .filter((node) => node.contentType?.startsWith("image/") === true)
            .sort((left, right) => photoTime(right).localeCompare(photoTime(left)))
    }, [entriesQuery.data])

    const albums = useMemo(() => albumsQuery.data?.driveAlbums ?? [], [albumsQuery.data])

    const monthGroups = useMemo((): { month: string; photos: Photo[] }[] => {
        const groups: { month: string; photos: Photo[] }[] = []
        for (const photo of photos) {
            const month = formatMonth(photoTime(photo))
            const last = groups[groups.length - 1]
            if (last !== undefined && last.month === month) {
                last.photos.push(photo)
            } else {
                groups.push({ month, photos: [photo] })
            }
        }
        return groups
    }, [photos])

    const lightboxIndex = useMemo(
        () => photos.findIndex((photo) => photo.id === lightboxId),
        [photos, lightboxId],
    )
    const lightboxPhoto = lightboxIndex >= 0 ? photos[lightboxIndex] : undefined

    const act = useCallback(async (action: () => Promise<unknown>): Promise<void> => {
        setActionError(undefined)
        try {
            await action()
        } catch (caught) {
            setActionError(caught instanceof Error ? caught.message : "The action failed.")
        }
    }, [])

    const importFiles = useCallback(
        (files: File[]): void => {
            const images = files.filter((file) => file.type.startsWith("image/"))
            if (images.length === 0) {
                return
            }
            void uploader.uploadFiles({
                files: images.map((file) => ({ file, pathSegments: [] })),
                parentId: null,
                prepare: prepareImage,
            })
        },
        [uploader],
    )

    const onDrop = useCallback(
        (event: React.DragEvent): void => {
            event.preventDefault()
            dragDepthRef.current = 0
            setDragActive(false)
            void collectDroppedFiles(event.dataTransfer).then((incoming) => {
                importFiles(incoming.map((item) => item.file))
            })
        },
        [importFiles],
    )

    const toggleStar = useCallback(
        (photo: Photo): void => {
            void act(() =>
                setStarred({ variables: { input: { objectId: photo.id, starred: !photo.starred } } }),
            )
        },
        [act, setStarred],
    )

    const saveCaption = useCallback(
        (photo: Photo, caption: string): void => {
            const next = caption.trim()
            if (next === (photo.caption ?? "")) {
                return
            }
            void act(() =>
                setCaption({
                    variables: { input: { objectId: photo.id, caption: next === "" ? null : next } },
                }),
            )
        },
        [act, setCaption],
    )

    /**
     * Rotate = client re-encode: fetch the current bytes, turn them 90° on a
     * canvas, file the result (plus a fresh thumbnail) as new uploads, and
     * rebind the entry. Functions never touch image data.
     */
    const rotatePhoto = useCallback(
        (photo: Photo): void => {
            void act(async () => {
                if (photo.fileUrl == null) {
                    return
                }
                const response = await fetch(resolveStorageUrl(driveStorageEndpoint(), photo.fileUrl))
                const original = await response.blob()
                const rotated = await rotateImageFile(original, 1)
                if (rotated === undefined) {
                    throw new Error("This image could not be rotated.")
                }
                const rotatedFile = new File([rotated], photo.name, { type: "image/webp" })
                const [uploadId, thumbBlob] = await Promise.all([
                    uploadBlobThroughKernel(client, rotated, "image/webp"),
                    makeImageThumbnail(rotatedFile),
                ])
                const thumbUploadId =
                    thumbBlob !== undefined
                        ? await uploadBlobThroughKernel(client, thumbBlob, "image/webp")
                        : undefined
                await replaceMedia({
                    variables: {
                        input: {
                            objectId: photo.id,
                            idempotencyKey: crypto.randomUUID(),
                            uploadId,
                            thumbUploadId,
                        },
                    },
                })
                refetchLibrary()
            })
        },
        [act, client, refetchLibrary, replaceMedia],
    )

    const trashPhoto = useCallback(
        (photo: Photo): void => {
            setLightboxId(undefined)
            void act(async () => {
                await trashEntry({ variables: { input: { objectId: photo.id } } })
                setNotice(`"${photo.name}" moved to the trash.`)
                refetchLibrary()
            })
        },
        [act, refetchLibrary, trashEntry],
    )

    const addToAlbum = useCallback(
        (photo: Photo, albumId: string): void => {
            void act(async () => {
                await addAlbumEntry({
                    variables: {
                        input: { idempotencyKey: crypto.randomUUID(), albumId, entryId: photo.id },
                    },
                })
                const album = albums.find((candidate) => candidate.id === albumId)
                setNotice(`Added to "${album?.name ?? "the album"}".`)
                refetchLibrary()
            })
        },
        [act, addAlbumEntry, albums, refetchLibrary],
    )

    const removeFromAlbum = useCallback(
        (photo: Photo): void => {
            if (openAlbum === undefined) {
                return
            }
            void act(async () => {
                await removeAlbumEntry({
                    variables: { input: { albumId: openAlbum.id, entryId: photo.id } },
                })
                refetchLibrary()
            })
        },
        [act, openAlbum, refetchLibrary, removeAlbumEntry],
    )

    const runClearLibrary = useCallback((): void => {
        setClearConfirmOpen(false)
        setOpenAlbum(undefined)
        setLightboxId(undefined)
        void act(async () => {
            await clearLibrary()
            markDriveLibraryCleared(imagesSeedManifest)
            setTab("timeline")
            setNotice("The library is empty.")
            refetchLibrary()
        })
    }, [act, clearLibrary, refetchLibrary])

    const listBusy = entriesQuery.loading && photos.length === 0

    const navSections = useMemo(
        (): AppShellNavSection[] => [
            {
                id: "views",
                title: "Views",
                items: [
                    {
                        id: NAV_TIMELINE,
                        label: "Timeline",
                        icon: <span className={styles.navGlyph}>▤</span>,
                    },
                    {
                        id: NAV_FAVORITES,
                        label: "Favorites",
                        icon: <span className={styles.navGlyph}>★</span>,
                    },
                    {
                        id: NAV_ALBUMS,
                        label: "Albums",
                        icon: <span className={styles.navGlyph}>▣</span>,
                        badgeText: albums.length > 0 ? String(albums.length) : undefined,
                    },
                ],
            },
            {
                id: "demo",
                title: "Demo",
                items: [
                    {
                        id: NAV_CLEAR,
                        label: imagesContent.clearDemoLabel,
                        icon: <span className={styles.navGlyph}>⌫</span>,
                    },
                ],
            },
        ],
        [albums.length],
    )

    const onNavSelect = useCallback((item: AppShellNavItem): void => {
        if (item.id === NAV_CLEAR) {
            setClearConfirmOpen(true)
            return
        }
        const nextTab = (Object.keys(NAV_ID_BY_TAB) as Tab[]).find(
            (candidate) => NAV_ID_BY_TAB[candidate] === item.id,
        )
        if (nextTab !== undefined) {
            setTab(nextTab)
            setOpenAlbum(undefined)
        }
    }, [])

    const emptyMessage = inAlbum
        ? imagesContent.emptyAlbum
        : tab === "favorites"
          ? imagesContent.emptyFavorites
          : trimmedSearch.length > 0
            ? imagesContent.emptySearch
            : imagesContent.emptyTimeline

    return (
        <AppShell
            title={imagesContent.appName}
            brandIcon={<ContactSheetBrandIcon />}
            sections={navSections}
            activeItemId={NAV_ID_BY_TAB[tab]}
            onItemSelect={onNavSelect}
        >
            <div
                className={styles.page}
                onDragEnter={(event) => {
                    event.preventDefault()
                    dragDepthRef.current += 1
                    setDragActive(true)
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => {
                    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
                    if (dragDepthRef.current === 0) {
                        setDragActive(false)
                    }
                }}
                onDrop={onDrop}
            >
                <div className={styles.toolbar}>
                    {tab === "timeline" ? (
                        <input
                            className={styles.searchInput}
                            type="search"
                            placeholder="Search names and captions…"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search the library"
                        />
                    ) : null}
                    <div className={styles.toolbarActions}>
                        <button
                            type="button"
                            className={styles.buttonPrimary}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploader.uploading}
                        >
                            {uploader.uploading ? "Importing…" : "Import"}
                        </button>
                    </div>
                </div>

                <div className={styles.statusLine}>
                    <span>
                        {inAlbum
                            ? `Album / ${openAlbum.name}`
                            : tab === "albums"
                              ? "Albums"
                              : tab === "favorites"
                                ? "Favorites"
                                : trimmedSearch.length > 0
                                  ? `Search: "${trimmedSearch}"`
                                  : "Timeline"}
                    </span>
                    <span>
                        {tab === "albums" && !inAlbum
                            ? `${albums.length} ${albums.length === 1 ? "album" : "albums"}`
                            : `${photos.length} ${photos.length === 1 ? "frame" : "frames"}`}
                    </span>
                    {inAlbum ? (
                        <>
                            <button
                                type="button"
                                className={styles.buttonGhost}
                                onClick={() => setOpenAlbum(undefined)}
                            >
                                All albums
                            </button>
                            <button
                                type="button"
                                className={styles.buttonDanger}
                                onClick={() => {
                                    const target = openAlbum
                                    setOpenAlbum(undefined)
                                    void act(async () => {
                                        await deleteAlbum({
                                            variables: { input: { objectId: target.id } },
                                        })
                                        setNotice(
                                            `Deleted the album "${target.name}" — its photos stay in the library.`,
                                        )
                                        refetchLibrary()
                                    })
                                }}
                            >
                                Delete album
                            </button>
                        </>
                    ) : null}
                    {tab === "albums" && !inAlbum ? (
                        <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() => setNewAlbumOpen(true)}
                        >
                            New album
                        </button>
                    ) : null}
                </div>

                {seeding ? <div className={styles.noticeBar}>{imagesContent.seeding}</div> : null}
                {notice !== undefined ? <div className={styles.noticeBar}>{notice}</div> : null}
                {actionError !== undefined ? <div className={styles.errorBar}>{actionError}</div> : null}

                {tab === "albums" && !inAlbum ? (
                    albums.length === 0 ? (
                        <div className={styles.emptyState}>
                            No albums yet — create one and fill it from the lightbox.
                        </div>
                    ) : (
                        <div className={styles.albumShelf}>
                            {albums.map((album) => (
                                <button
                                    key={album.id}
                                    type="button"
                                    className={styles.albumCard}
                                    onClick={() => setOpenAlbum(album)}
                                >
                                    <span className={styles.albumCoverEmpty}>
                                        {album.entryCount} {album.entryCount === 1 ? "frame" : "frames"}
                                    </span>
                                    <span className={styles.albumMeta}>
                                        <span className={styles.albumName}>{album.name}</span>
                                        <span className={styles.albumCount}>
                                            {formatEntryDate(album.updatedTime)}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )
                ) : listBusy ? (
                    <Spinner size="lg" />
                ) : photos.length === 0 ? (
                    <div className={styles.emptyState}>{emptyMessage}</div>
                ) : (
                    monthGroups.map((group) => (
                        <React.Fragment key={group.month}>
                            <h2 className={styles.monthHeading}>
                                {group.month}
                                <span className={styles.monthCount}>
                                    {group.photos.length} {group.photos.length === 1 ? "frame" : "frames"}
                                </span>
                            </h2>
                            <div className={styles.masonry}>
                                {group.photos.map((photo) => (
                                    <PhotoFrame
                                        key={photo.id}
                                        photo={photo}
                                        onOpen={() => setLightboxId(photo.id)}
                                        onToggleStar={() => toggleStar(photo)}
                                    />
                                ))}
                            </div>
                        </React.Fragment>
                    ))
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        event.target.value = ""
                        importFiles(files)
                    }}
                />

                {dragActive ? (
                    <div className={styles.dropOverlay}>
                        <div className={styles.dropOverlayCard}>Drop photos to import</div>
                    </div>
                ) : null}

                {uploader.jobs.length > 0 ? (
                    <UploadTray
                        jobs={uploader.jobs}
                        uploading={uploader.uploading}
                        onClose={uploader.clearJobs}
                    />
                ) : null}

                {lightboxPhoto !== undefined ? (
                    <Lightbox
                        photo={lightboxPhoto}
                        index={lightboxIndex}
                        count={photos.length}
                        albums={albums}
                        inAlbum={inAlbum}
                        onNavigate={(delta) => {
                            const next = photos[(lightboxIndex + delta + photos.length) % photos.length]
                            setLightboxId(next.id)
                        }}
                        onClose={() => setLightboxId(undefined)}
                        onToggleStar={() => toggleStar(lightboxPhoto)}
                        onSaveCaption={(caption) => saveCaption(lightboxPhoto, caption)}
                        onRotate={() => rotatePhoto(lightboxPhoto)}
                        onTrash={() => trashPhoto(lightboxPhoto)}
                        onAddToAlbum={(albumId) => addToAlbum(lightboxPhoto, albumId)}
                        onRemoveFromAlbum={() => removeFromAlbum(lightboxPhoto)}
                    />
                ) : null}

                {newAlbumOpen ? (
                    <NameDialog
                        title="New album"
                        initialValue=""
                        submitLabel="Create"
                        onSubmit={(name) => {
                            setNewAlbumOpen(false)
                            void act(async () => {
                                await createAlbum({
                                    variables: {
                                        input: { idempotencyKey: crypto.randomUUID(), fields: { name } },
                                    },
                                })
                                refetchLibrary()
                            })
                        }}
                        onClose={() => setNewAlbumOpen(false)}
                    />
                ) : null}

                {clearConfirmOpen ? (
                    <div className={styles.dialogBackdrop} onClick={() => setClearConfirmOpen(false)}>
                        <div className={styles.dialogCard} onClick={(event) => event.stopPropagation()}>
                            <h2 className={styles.dialogTitle}>{imagesContent.clearDemoLabel}</h2>
                            <p className={styles.dialogBodyText}>{imagesContent.clearDemoConfirm}</p>
                            <div className={styles.dialogActions}>
                                <button
                                    type="button"
                                    className={styles.buttonGhost}
                                    onClick={() => setClearConfirmOpen(false)}
                                >
                                    Keep everything
                                </button>
                                <button
                                    type="button"
                                    className={styles.buttonDanger}
                                    onClick={runClearLibrary}
                                >
                                    Clear the library
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </AppShell>
    )
}

function PhotoFrame(props: {
    photo: Photo
    onOpen: () => void
    onToggleStar: () => void
}): React.ReactElement {
    const { photo } = props
    const imageUrl = photo.thumbUrl ?? photo.fileUrl
    return (
        <div
            className={styles.frame}
            onClick={props.onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    props.onOpen()
                }
            }}
        >
            {imageUrl != null ? (
                <img
                    className={styles.frameImage}
                    src={resolveStorageUrl(driveStorageEndpoint(), imageUrl)}
                    alt={photo.caption ?? photo.name}
                    loading="lazy"
                />
            ) : null}
            <button
                type="button"
                className={`${styles.frameStar} ${photo.starred ? styles.frameStarOn : ""}`}
                aria-label={photo.starred ? "Unstar" : "Star"}
                onClick={(event) => {
                    event.stopPropagation()
                    props.onToggleStar()
                }}
            >
                {photo.starred ? "★" : "☆"}
            </button>
            <span className={styles.frameMeta}>
                <span className={styles.frameCaption}>{photo.caption ?? ""}</span>
                <span className={styles.frameNumber}>{formatEntryDate(photoTime(photo))}</span>
            </span>
        </div>
    )
}

function Lightbox(props: {
    photo: Photo
    index: number
    count: number
    albums: Album[]
    inAlbum: boolean
    onNavigate: (delta: number) => void
    onClose: () => void
    onToggleStar: () => void
    onSaveCaption: (caption: string) => void
    onRotate: () => void
    onTrash: () => void
    onAddToAlbum: (albumId: string) => void
    onRemoveFromAlbum: () => void
}): React.ReactElement {
    const { photo } = props
    const [zoomed, setZoomed] = useState(false)
    const [slideshow, setSlideshow] = useState(false)
    const [captionDraft, setCaptionDraft] = useState(photo.caption ?? "")
    const [albumChoice, setAlbumChoice] = useState("")

    // The draft follows the photo as the lightbox navigates.
    useEffect(() => {
        setCaptionDraft(photo.caption ?? "")
        setZoomed(false)
    }, [photo.id, photo.caption])

    const { onNavigate, onClose } = props
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.target instanceof HTMLInputElement) {
                return
            }
            if (event.key === "ArrowRight") {
                onNavigate(1)
            } else if (event.key === "ArrowLeft") {
                onNavigate(-1)
            } else if (event.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [onNavigate, onClose])

    useEffect(() => {
        if (!slideshow) {
            return
        }
        const timer = window.setInterval(() => onNavigate(1), SLIDESHOW_INTERVAL_MS)
        return () => window.clearInterval(timer)
    }, [slideshow, onNavigate])

    const resolvedUrl =
        photo.fileUrl != null ? resolveStorageUrl(driveStorageEndpoint(), photo.fileUrl) : undefined

    return (
        <div className={styles.lightboxBackdrop} role="dialog" aria-label={photo.name}>
            <div className={styles.lightboxTop}>
                <span className={styles.lightboxTitle}>
                    {photo.name} · {formatEntryDate(photoTime(photo))}
                </span>
                <span>
                    {props.index + 1}/{props.count}
                </span>
                <button
                    type="button"
                    className={styles.lightboxButton}
                    onClick={props.onToggleStar}
                    aria-pressed={photo.starred}
                >
                    {photo.starred ? "★ Starred" : "☆ Star"}
                </button>
                <button type="button" className={styles.lightboxButton} onClick={props.onRotate}>
                    Rotate 90°
                </button>
                <button
                    type="button"
                    className={styles.lightboxButton}
                    onClick={() => setSlideshow((current) => !current)}
                    aria-pressed={slideshow}
                >
                    {slideshow ? "Stop slideshow" : "Slideshow"}
                </button>
                <button type="button" className={styles.lightboxButtonDanger} onClick={props.onTrash}>
                    Trash
                </button>
                <button type="button" className={styles.lightboxButton} onClick={props.onClose}>
                    Close
                </button>
            </div>
            <div className={styles.lightboxStage}>
                {resolvedUrl !== undefined ? (
                    <img
                        className={`${styles.lightboxImage} ${zoomed ? styles.lightboxImageZoomed : ""}`}
                        src={resolvedUrl}
                        alt={photo.caption ?? photo.name}
                        style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
                        onClick={() => setZoomed((current) => !current)}
                    />
                ) : null}
                {props.count > 1 ? (
                    <>
                        <button
                            type="button"
                            className={`${styles.lightboxNav} ${styles.lightboxNavLeft}`}
                            onClick={() => props.onNavigate(-1)}
                            aria-label="Previous photo"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            className={`${styles.lightboxNav} ${styles.lightboxNavRight}`}
                            onClick={() => props.onNavigate(1)}
                            aria-label="Next photo"
                        >
                            ›
                        </button>
                    </>
                ) : null}
            </div>
            <div className={styles.lightboxBottom}>
                <input
                    className={styles.captionInput}
                    value={captionDraft}
                    placeholder="Add a caption…"
                    onChange={(event) => setCaptionDraft(event.target.value)}
                    onBlur={() => props.onSaveCaption(captionDraft)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            props.onSaveCaption(captionDraft)
                        }
                    }}
                    aria-label="Caption"
                />
                {props.inAlbum ? (
                    <button type="button" className={styles.lightboxButton} onClick={props.onRemoveFromAlbum}>
                        Remove from album
                    </button>
                ) : props.albums.length > 0 ? (
                    <>
                        <select
                            className={styles.lightboxSelect}
                            value={albumChoice}
                            onChange={(event) => setAlbumChoice(event.target.value)}
                            aria-label="Album"
                        >
                            <option value="">Add to album…</option>
                            {props.albums.map((album) => (
                                <option key={album.id} value={album.id}>
                                    {album.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={styles.lightboxButton}
                            disabled={albumChoice === ""}
                            onClick={() => {
                                if (albumChoice !== "") {
                                    props.onAddToAlbum(albumChoice)
                                    setAlbumChoice("")
                                }
                            }}
                        >
                            Add
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    )
}

function UploadTray(props: {
    jobs: DriveUploadJob[]
    uploading: boolean
    onClose: () => void
}): React.ReactElement {
    const done = props.jobs.filter((job) => job.status === "done").length
    return (
        <aside className={styles.uploadTray} aria-label="Imports">
            <div className={styles.uploadTrayHeader}>
                <span>
                    Importing {done}/{props.jobs.length}
                </span>
                {!props.uploading ? (
                    <button type="button" className={styles.uploadTrayClose} onClick={props.onClose}>
                        Dismiss
                    </button>
                ) : null}
            </div>
            {props.jobs.map((job) => (
                <div key={job.key} className={styles.uploadJobRow}>
                    <span className={styles.uploadJobName}>{job.fileName}</span>
                    <span className={job.status === "error" ? styles.uploadJobError : styles.uploadJobStatus}>
                        {job.status === "error" ? (job.error ?? "Failed") : job.status}
                    </span>
                </div>
            ))}
        </aside>
    )
}

function NameDialog(props: {
    title: string
    initialValue: string
    submitLabel: string
    onSubmit: (name: string) => void
    onClose: () => void
}): React.ReactElement {
    const [value, setValue] = useState(props.initialValue)
    return (
        <div className={styles.dialogBackdrop} onClick={props.onClose}>
            <form
                className={styles.dialogCard}
                onClick={(event) => event.stopPropagation()}
                onSubmit={(event) => {
                    event.preventDefault()
                    const trimmed = value.trim()
                    if (trimmed.length > 0) {
                        props.onSubmit(trimmed)
                    }
                }}
            >
                <h2 className={styles.dialogTitle}>{props.title}</h2>
                <input
                    className={styles.dialogInput}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    autoFocus
                    aria-label="Name"
                />
                <div className={styles.dialogActions}>
                    <button type="button" className={styles.buttonGhost} onClick={props.onClose}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.buttonPrimary}>
                        {props.submitLabel}
                    </button>
                </div>
            </form>
        </div>
    )
}
