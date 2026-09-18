import {
    fetchProofingRoom,
    readStoredJson,
    submitProofingSelection,
    writeStoredJson,
    type ProofingRoomManifest,
} from "@base/core"
import { MarketingGallery, MarketingPage } from "@ui"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { PageMeta } from "../../Seo/PageMeta"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    demoProofingAlbums,
    photoId,
    photographer,
    proofing,
    type DemoProofingAlbum,
    type PhotoImage,
} from "./content"
import * as styles from "./ProofingPage.styles.css"

/**
 * The client proofing room (/proof?album=<slug>). On a published site the
 * access code is checked by GET /__proofing/room — it never ships in the
 * bundle — and the gallery renders from the returned preview URLs.
 * Selections POST to /__proofing/select.
 *
 * Baked template previews have no site router, so an unreachable door
 * falls back to `demoProofingAlbums` (the same convention as booking and
 * forms: a missing reserved path is sandbox, a JSON door error is real).
 */

const accessKey = (slug: string): string => `photography-family-proof-access:${slug}`
const selectionKey = (slug: string): string => `photography-family-proof-selection:${slug}`
const sentKey = (slug: string): string => `photography-family-proof-sent:${slug}`

function readSessionCode(slug: string): string | undefined {
    try {
        const value = sessionStorage.getItem(accessKey(slug))
        return value !== null && value !== "" && value !== "granted" ? value : undefined
    } catch {
        return undefined
    }
}

function writeSessionCode(slug: string, code: string): void {
    try {
        sessionStorage.setItem(accessKey(slug), code)
    } catch {
        // Private mode without storage: the gate simply re-asks next visit.
    }
}

function clearSessionCode(slug: string): void {
    try {
        sessionStorage.removeItem(accessKey(slug))
    } catch {
        // Ignore.
    }
}

interface GalleryImage {
    imageId: string
    src: string
    alt: string
    width: number
    height: number
    srcSet?: PhotoImage["srcSet"]
}

interface RoomView {
    slug: string
    code: string
    title: string
    clientLine?: string
    note?: string
    images: GalleryImage[]
}

function roomFromManifest(slug: string, code: string, room: ProofingRoomManifest): RoomView {
    return {
        slug,
        code,
        title: room.name,
        images: room.images.map((image) => ({
            imageId: image.imageId,
            src: image.previewUrl,
            alt: image.filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || image.imageId,
            width: image.width,
            height: image.height,
        })),
    }
}

function roomFromDemo(album: DemoProofingAlbum, code: string): RoomView {
    return {
        slug: album.slug,
        code,
        title: album.title,
        clientLine: `For ${album.clientName}`,
        note: album.note,
        images: album.images.map((image) => ({
            imageId: photoId(image),
            src: image.src,
            alt: image.alt,
            width: image.width,
            height: image.height,
            srcSet: image.srcSet,
        })),
    }
}

function demoRoomFor(slug: string, code: string): RoomView | "invalid_code" | undefined {
    const album = demoProofingAlbums.find((entry) => entry.slug === slug)
    if (album === undefined) {
        return undefined
    }
    if (code.trim() !== album.accessCode) {
        return "invalid_code"
    }
    return roomFromDemo(album, code)
}

type GateError = "invalid_code" | "rate_limited"

type RoomState =
    | { kind: "gate"; error?: GateError }
    | { kind: "loading" }
    | { kind: "room"; room: RoomView }
    | { kind: "not_found" }
    | { kind: "not_configured" }

export default function ProofingPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const slug = searchParams.get("album")?.trim() ?? ""

    return (
        <MarketingPage preset={PACK_REGISTERS["photography-family"]}>
            {/* noindex: proofing rooms are unlisted client pages, never search results. */}
            <PageMeta
                title={`Your gallery — ${photographer.name}`}
                siteName={photographer.name}
                description="Private client proofing gallery."
                robots="noindex, nofollow"
            />
            <div className={styles.page}>
                {slug === "" ? (
                    <p className={styles.missing}>
                        This gallery link isn&apos;t complete — ask your photographer for the full link.
                    </p>
                ) : (
                    <ProofingRoom slug={slug} />
                )}
            </div>
        </MarketingPage>
    )
}

function ProofingRoom({ slug }: { slug: string }): React.ReactElement {
    const restoredCode = React.useRef(readSessionCode(slug))
    const [state, setState] = React.useState<RoomState>(() =>
        restoredCode.current !== undefined ? { kind: "loading" } : { kind: "gate" },
    )

    const unlock = React.useCallback(
        async (code: string): Promise<void> => {
            setState({ kind: "loading" })
            const result = await fetchProofingRoom(slug, code)
            if (result.status === "ok") {
                writeSessionCode(slug, code)
                setState({ kind: "room", room: roomFromManifest(slug, code, result.room) })
                return
            }
            if (result.status === "invalid_code") {
                clearSessionCode(slug)
                setState({ kind: "gate", error: "invalid_code" })
                return
            }
            if (result.status === "rate_limited") {
                setState({ kind: "gate", error: "rate_limited" })
                return
            }
            if (result.status === "not_found" || result.status === "invalid_request") {
                clearSessionCode(slug)
                setState({ kind: "not_found" })
                return
            }
            if (result.status === "not_configured") {
                clearSessionCode(slug)
                setState({ kind: "not_configured" })
                return
            }
            // Unreachable reserved path: baked preview / sandbox. Demo fixtures
            // only — a published door that answered is handled above.
            const demo = demoRoomFor(slug, code)
            if (demo === "invalid_code") {
                clearSessionCode(slug)
                setState({ kind: "gate", error: "invalid_code" })
                return
            }
            if (demo !== undefined) {
                writeSessionCode(slug, code)
                setState({ kind: "room", room: demo })
                return
            }
            clearSessionCode(slug)
            setState({ kind: "not_found" })
        },
        [slug],
    )

    React.useEffect(() => {
        if (restoredCode.current !== undefined) {
            void unlock(restoredCode.current)
        }
    }, [unlock])

    if (state.kind === "not_found") {
        return <p className={styles.missing}>{proofing.gate.notFound}</p>
    }
    if (state.kind === "not_configured") {
        return <p className={styles.missing}>{proofing.gate.notConfigured}</p>
    }
    if (state.kind === "room") {
        return <SelectionGallery room={state.room} />
    }
    return (
        <AccessGate
            error={state.kind === "gate" ? state.error : undefined}
            checking={state.kind === "loading"}
            onUnlock={(code) => {
                void unlock(code)
            }}
        />
    )
}

/** The code gate: a single centered card. The code is sent to the door. */
function AccessGate({
    error,
    checking,
    onUnlock,
}: {
    error?: GateError
    checking: boolean
    onUnlock: (code: string) => void
}): React.ReactElement {
    const [code, setCode] = React.useState("")

    const submit = (event: React.FormEvent): void => {
        event.preventDefault()
        const trimmed = code.trim()
        if (trimmed === "" || checking) {
            return
        }
        onUnlock(trimmed)
    }

    return (
        <div className={styles.gate}>
            <form className={styles.gateCard} onSubmit={submit}>
                <span className={styles.studioMark}>{photographer.name}</span>
                <h1 className={styles.gateTitle}>{proofing.gate.title}</h1>
                <p className={styles.gateBody}>{proofing.gate.body}</p>
                <div className={styles.gateForm}>
                    <input
                        className={styles.gateInput}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={proofing.gate.placeholder}
                        aria-label={proofing.gate.placeholder}
                        value={code}
                        disabled={checking}
                        onChange={(event) => {
                            setCode(event.target.value)
                        }}
                    />
                    <button type="submit" className={styles.gateButton} disabled={checking}>
                        {checking ? proofing.gate.checking : proofing.gate.cta}
                    </button>
                </div>
                {error === "invalid_code" ? <p className={styles.gateError}>{proofing.gate.error}</p> : null}
                {error === "rate_limited" ? (
                    <p className={styles.gateError}>{proofing.gate.rateLimited}</p>
                ) : null}
            </form>
        </div>
    )
}

/**
 * The proofing gallery itself: the album in selection mode, a fixed tray
 * with the running count, and a confirm step (name, email, optional note).
 * Picks persist locally so a family can leave and come back; sending posts
 * imageIds to /__proofing/select.
 */
function SelectionGallery({ room }: { room: RoomView }): React.ReactElement {
    const [selectedIds, setSelectedIds] = React.useState<readonly string[]>(() =>
        readStoredJson<string[]>(selectionKey(room.slug), []),
    )
    const [phase, setPhase] = React.useState<"choosing" | "confirming" | "sent">(() =>
        readStoredJson<boolean>(sentKey(room.slug), false) ? "sent" : "choosing",
    )
    const [visitorName, setVisitorName] = React.useState("")
    const [visitorEmail, setVisitorEmail] = React.useState("")
    const [note, setNote] = React.useState("")
    const [isSending, setIsSending] = React.useState(false)
    const [sendError, setSendError] = React.useState<string | undefined>(undefined)

    const allIds = room.images.map((image) => image.imageId)
    const selectedIndexes = new Set(allIds.flatMap((id, index) => (selectedIds.includes(id) ? [index] : [])))

    const toggleSelect = (index: number): void => {
        const id = allIds[index]
        if (id === undefined) {
            return
        }
        // Keep selection order = album order: rebuild from allIds so the
        // submitted pick list reads in the album's own sequence.
        const next = selectedIds.includes(id)
            ? selectedIds.filter((entry) => entry !== id)
            : allIds.filter((entry) => selectedIds.includes(entry) || entry === id)
        setSelectedIds(next)
        writeStoredJson(selectionKey(room.slug), next)
    }

    const send = (): void => {
        if (isSending || visitorName.trim() === "" || visitorEmail.trim() === "") {
            return
        }
        setIsSending(true)
        setSendError(undefined)
        void submitProofingSelection({
            slug: room.slug,
            code: room.code,
            visitorName: visitorName.trim(),
            visitorEmail: visitorEmail.trim(),
            ...(note.trim() !== "" ? { note: note.trim() } : {}),
            picks: selectedIds,
            fallbackStorageKey: `photography-family-proof-fallback:${room.slug}`,
        }).then((result) => {
            setIsSending(false)
            if (result.status === "ok") {
                writeStoredJson(sentKey(room.slug), true)
                setPhase("sent")
                return
            }
            if (result.status === "invalid_code") {
                setSendError(proofing.gate.error)
                return
            }
            if (result.status === "rate_limited") {
                setSendError(proofing.gate.rateLimited)
                return
            }
            if (result.status === "not_found" || result.status === "not_configured") {
                setSendError(proofing.gate.notFound)
                return
            }
            setSendError(proofing.selection.sendError)
        })
    }

    const canSend = visitorName.trim() !== "" && visitorEmail.trim() !== "" && !isSending

    return (
        <>
            <header className={styles.header}>
                <span className={styles.studioMark}>{photographer.name}</span>
                <h1 className={styles.title}>{room.title}</h1>
                {room.clientLine !== undefined ? (
                    <span className={styles.clientLine}>{room.clientLine}</span>
                ) : null}
                {room.note !== undefined ? <p className={styles.note}>{room.note}</p> : null}
            </header>

            {phase === "sent" ? (
                <div className={styles.sentCard}>
                    <h2 className={styles.sentTitle}>{proofing.selection.sentTitle}</h2>
                    <p className={styles.sentBody}>{proofing.selection.sentBody}</p>
                    <button
                        type="button"
                        className={styles.sentButton}
                        onClick={() => {
                            writeStoredJson(sentKey(room.slug), false)
                            setPhase("choosing")
                        }}
                    >
                        {proofing.selection.reopenCta}
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.galleryWrap}>
                        <MarketingGallery
                            variant="justified"
                            lightbox
                            items={room.images.map((image) => ({
                                media: {
                                    kind: "image",
                                    src: image.src,
                                    alt: image.alt,
                                    width: image.width,
                                    height: image.height,
                                    ...(image.srcSet !== undefined ? { srcSet: image.srcSet } : {}),
                                },
                                caption: image.imageId,
                            }))}
                            selectedIndexes={selectedIndexes}
                            onToggleSelect={toggleSelect}
                        />
                    </div>
                    <div className={styles.tray}>
                        <div className={styles.trayInner}>
                            <span className={styles.trayCount} aria-live="polite">
                                {selectedIds.length === 1
                                    ? "1 photograph selected"
                                    : `${selectedIds.length} photographs selected`}
                            </span>
                            {phase === "confirming" ? (
                                <>
                                    <div className={styles.visitorFields}>
                                        <input
                                            className={styles.visitorInput}
                                            autoComplete="name"
                                            placeholder={proofing.selection.namePlaceholder}
                                            aria-label={proofing.selection.namePlaceholder}
                                            value={visitorName}
                                            onChange={(event) => setVisitorName(event.target.value)}
                                        />
                                        <input
                                            className={styles.visitorInput}
                                            type="email"
                                            autoComplete="email"
                                            placeholder={proofing.selection.emailPlaceholder}
                                            aria-label={proofing.selection.emailPlaceholder}
                                            value={visitorEmail}
                                            onChange={(event) => setVisitorEmail(event.target.value)}
                                        />
                                        <textarea
                                            className={styles.trayNote}
                                            rows={1}
                                            placeholder={proofing.selection.notePlaceholder}
                                            aria-label={proofing.selection.notePlaceholder}
                                            value={note}
                                            onChange={(event) => setNote(event.target.value)}
                                        />
                                    </div>
                                    {sendError !== undefined ? (
                                        <p className={styles.trayError}>{sendError}</p>
                                    ) : null}
                                    <button
                                        type="button"
                                        className={styles.trayButton}
                                        disabled={!canSend}
                                        onClick={send}
                                    >
                                        {isSending ? proofing.selection.sending : proofing.selection.confirm}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.trayGhostButton}
                                        disabled={isSending}
                                        onClick={() => setPhase("choosing")}
                                    >
                                        {proofing.selection.cancel}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.trayButton}
                                    disabled={selectedIds.length === 0}
                                    onClick={() => setPhase("confirming")}
                                >
                                    {proofing.selection.sendCta}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
