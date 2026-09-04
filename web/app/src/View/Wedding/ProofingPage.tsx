import { readStoredJson, submitForm, writeStoredJson } from "@base/core"
import { MarketingGallery, MarketingPage } from "@ui"
import React from "react"
import { useSearchParams } from "react-router-dom"
import { PageMeta } from "../../Seo/PageMeta"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { photoId, photographer, proofing, proofingAlbums, type ProofingAlbum } from "./content"
import * as styles from "./ProofingPage.styles.css"

/**
 * The client proofing room (/proof?album=<slug>): an unlisted, code-gated
 * selection gallery. The photographer shares the link and the code after
 * the wedding; the couple (and their families) pick frames — persisted
 * locally so they can return — and send the selection through the managed
 * forms pipeline: the photographer gets an email and a dashboard entry
 * listing the exact frame ids.
 *
 * The code gate is soft privacy (the code ships in the bundle) — it keeps
 * casual visitors and crawlers out, like an unlisted video link. True access
 * control and full-res delivery are platform proofing v2.
 */

const accessKey = (slug: string): string => `wedding-proof-access:${slug}`
const selectionKey = (slug: string): string => `wedding-proof-selection:${slug}`
const sentKey = (slug: string): string => `wedding-proof-sent:${slug}`

function readSessionAccess(slug: string): boolean {
    try {
        return sessionStorage.getItem(accessKey(slug)) === "granted"
    } catch {
        return false
    }
}

function writeSessionAccess(slug: string): void {
    try {
        sessionStorage.setItem(accessKey(slug), "granted")
    } catch {
        // Private mode without storage: the gate simply re-asks next visit.
    }
}

export default function ProofingPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const slug = searchParams.get("album")
    const album = slug !== null ? proofingAlbums.find((entry) => entry.slug === slug) : undefined

    return (
        <MarketingPage preset={PACK_REGISTERS.wedding}>
            {/* noindex: proofing rooms are unlisted client pages, never search results. */}
            <PageMeta
                title={`Proofing — ${photographer.name}`}
                siteName={photographer.name}
                description="Private client proofing gallery."
                robots="noindex, nofollow"
            />
            <div className={styles.page}>
                {album === undefined ? (
                    <p className={styles.missing}>
                        This proofing link isn&apos;t complete — ask your photographer for the full gallery
                        link.
                    </p>
                ) : (
                    <ProofingRoom album={album} />
                )}
            </div>
        </MarketingPage>
    )
}

function ProofingRoom({ album }: { album: ProofingAlbum }): React.ReactElement {
    const [unlocked, setUnlocked] = React.useState(() => readSessionAccess(album.slug))

    if (!unlocked) {
        return (
            <AccessGate
                album={album}
                onUnlock={() => {
                    writeSessionAccess(album.slug)
                    setUnlocked(true)
                }}
            />
        )
    }
    return <SelectionGallery album={album} />
}

/** The code gate: a single centered card, session-persisted on success. */
function AccessGate({ album, onUnlock }: { album: ProofingAlbum; onUnlock: () => void }): React.ReactElement {
    const [code, setCode] = React.useState("")
    const [showError, setShowError] = React.useState(false)

    const submit = (event: React.FormEvent): void => {
        event.preventDefault()
        if (code.trim() === album.accessCode) {
            onUnlock()
        } else {
            setShowError(true)
        }
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
                        onChange={(event) => {
                            setCode(event.target.value)
                            setShowError(false)
                        }}
                    />
                    <button type="submit" className={styles.gateButton}>
                        {proofing.gate.cta}
                    </button>
                </div>
                {showError ? <p className={styles.gateError}>{proofing.gate.error}</p> : null}
            </form>
        </div>
    )
}

/**
 * The proofing gallery itself: the album in selection mode, a fixed tray
 * with the running count, and a two-step send (optional note, confirm).
 * Picks persist locally so a client can leave and come back; sending posts
 * `formKey: "proofing-selection"` with the exact frame ids.
 */
function SelectionGallery({ album }: { album: ProofingAlbum }): React.ReactElement {
    const [selectedIds, setSelectedIds] = React.useState<readonly string[]>(() =>
        readStoredJson<string[]>(selectionKey(album.slug), []),
    )
    const [phase, setPhase] = React.useState<"choosing" | "confirming" | "sent">(() =>
        readStoredJson<boolean>(sentKey(album.slug), false) ? "sent" : "choosing",
    )
    const [note, setNote] = React.useState("")
    const [isSending, setIsSending] = React.useState(false)

    const allIds = album.images.map((image) => photoId(image))
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
        writeStoredJson(selectionKey(album.slug), next)
    }

    const send = (): void => {
        if (isSending) {
            return
        }
        setIsSending(true)
        void submitForm({
            formKey: "proofing-selection",
            fields: {
                album: album.slug,
                clientName: album.clientName,
                selectedImageIds: [...selectedIds],
                ...(note.trim() !== "" ? { note: note.trim() } : {}),
            },
            fallbackStorageKey: `wedding-proof-fallback:${album.slug}`,
        }).then(() => {
            writeStoredJson(sentKey(album.slug), true)
            setIsSending(false)
            setPhase("sent")
        })
    }

    return (
        <>
            <header className={styles.header}>
                <span className={styles.studioMark}>{photographer.name}</span>
                <h1 className={styles.title}>{album.title}</h1>
                <span className={styles.clientLine}>For {album.clientName}</span>
                <p className={styles.note}>{album.note}</p>
            </header>

            {phase === "sent" ? (
                <div className={styles.sentCard}>
                    <h2 className={styles.sentTitle}>{proofing.selection.sentTitle}</h2>
                    <p className={styles.sentBody}>{proofing.selection.sentBody}</p>
                    <button
                        type="button"
                        className={styles.sentButton}
                        onClick={() => {
                            writeStoredJson(sentKey(album.slug), false)
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
                            items={album.images.map((image) => ({
                                media: {
                                    kind: "image",
                                    src: image.src,
                                    alt: image.alt,
                                    width: image.width,
                                    height: image.height,
                                    srcSet: image.srcSet,
                                },
                                caption: photoId(image),
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
                                    <textarea
                                        className={styles.trayNote}
                                        rows={1}
                                        placeholder={proofing.selection.notePlaceholder}
                                        aria-label={proofing.selection.notePlaceholder}
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className={styles.trayButton}
                                        disabled={isSending}
                                        onClick={send}
                                    >
                                        {isSending ? "Sending…" : proofing.selection.confirm}
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
