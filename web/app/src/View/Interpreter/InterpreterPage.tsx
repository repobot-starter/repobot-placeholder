import { deriveStorageEndpoint, putUploadBytes } from "@base/core"
import { AppShell, Button } from "@ui"
import React, { useRef, useState } from "react"
import { runtime } from "../../Config/Runtime"
import {
    InterpretDocumentMutation,
    useCreateUploadMutation,
    useFinalizeUploadMutation,
    useInterpretDocumentMutation,
} from "../../generated/graphql/types"
import * as styles from "./InterpreterPage.styles.css"

type Interpretation = InterpretDocumentMutation["interpretDocument"]

const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

/**
 * Uploads are PRIVATE and owner-checked, so interpreting needs a session.
 * Signed-in users reuse theirs; signed-out visitors are signed in as
 * anonymous guests first, so the public page works on deployed environments.
 */
async function ensureSession(): Promise<void> {
    if ((await runtime.authClient.getToken()) === null) {
        await runtime.authClient.signInAnonymously()
    }
}

/** What the model is doing, narrated while the reading pane analyzes. */
const THINKING_PHASES = [
    "Scanning the pages",
    "Working out what this is",
    "Reading for meaning",
    "Pulling out the fields",
]

/**
 * The sandbox heuristic answers almost instantly; hold the analyzing
 * choreography on screen long enough that the reveal reads as a reveal.
 */
const MIN_ANALYZE_MS = 1600

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** The reading room has no navigation to offer the shell — it is one screen. */
const NO_NAV_SECTIONS: never[] = []

/** The old wordmark's glowing reading-lamp dot, worn as the shell brand mark. */
function ReadingLampBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="10" cy="10" r="4.75" fill="currentColor" />
        </svg>
    )
}

/**
 * The interpret pack's home surface: a two-pane reading room. Left is the
 * document — a drop zone that becomes the PDF preview once a file lands.
 * Right is the AI's reading, staged: an analyzing pass (the scan beam over
 * the document, a narrated ticker), then the detected type, verdict,
 * summary, key points, and extracted fields arrive in sequence. Text
 * extraction is real in every mode; the interpretation is the model on AI
 * deploys and a deterministic heuristic in the sandbox. The chrome is the
 * kernel AppShell in its minimal treatment (a single-screen tool wants no
 * nav rail); the reading status chip rides the Reading pane's label row.
 * See packs/interpret/PACK.md.
 */
export default function InterpreterPage(): React.ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [interpretation, setInterpretation] = useState<Interpretation | undefined>(undefined)
    const [doc, setDoc] = useState<{ name: string; url: string } | undefined>(undefined)

    const [createUpload] = useCreateUploadMutation()
    const [finalizeUpload] = useFinalizeUploadMutation()
    const [interpretDocument] = useInterpretDocumentMutation()

    const interpret = async (file: File): Promise<Interpretation | undefined> => {
        await ensureSession()
        const slotResult = await createUpload({
            variables: {
                input: {
                    idempotencyKey: crypto.randomUUID(),
                    fields: {
                        contentType: "application/pdf",
                        sizeBytes: file.size,
                        visibility: "PRIVATE",
                    },
                },
            },
        })
        const slot = slotResult.data?.createUpload
        if (slot === undefined) {
            throw new Error("The upload could not be created.")
        }
        await putUploadBytes({
            endpoint: storageEndpoint(),
            uploadUrl: slot.uploadUrl,
            headersJson: slot.headersJson,
            body: file,
        })
        await finalizeUpload({ variables: { input: { uploadId: slot.uploadId } } })
        const result = await interpretDocument({
            variables: { input: { uploadId: slot.uploadId } },
        })
        return result.data?.interpretDocument
    }

    const handleFile = async (file: File): Promise<void> => {
        if (busy) {
            return
        }
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setError("Only PDF files can be read here.")
            return
        }
        if (doc !== undefined) {
            URL.revokeObjectURL(doc.url)
        }
        setDoc({ name: file.name, url: URL.createObjectURL(file) })
        setInterpretation(undefined)
        setError(undefined)
        setBusy(true)
        try {
            const [result] = await Promise.all([interpret(file), wait(MIN_ANALYZE_MS)])
            setInterpretation(result)
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Reading the document failed.")
        } finally {
            setBusy(false)
        }
    }

    const reset = (): void => {
        if (doc !== undefined) {
            URL.revokeObjectURL(doc.url)
        }
        setDoc(undefined)
        setInterpretation(undefined)
        setError(undefined)
    }

    const onPick = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (file !== undefined) {
            void handleFile(file)
        }
    }

    const status = busy ? "reading" : interpretation !== undefined ? "read" : "idle"

    return (
        <AppShell
            title="Interpreter"
            brandIcon={<ReadingLampBrandIcon />}
            sections={NO_NAV_SECTIONS}
            onItemSelect={() => undefined}
        >
            <div className={styles.page}>
                <div className={styles.split}>
                    <section
                        className={`${styles.pane} ${dragActive ? styles.paneDragActive : ""}`}
                        onDragOver={(event) => {
                            event.preventDefault()
                            setDragActive(true)
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(event) => {
                            event.preventDefault()
                            setDragActive(false)
                            const file = event.dataTransfer.files?.[0]
                            if (file !== undefined) {
                                void handleFile(file)
                            }
                        }}
                    >
                        <span className={styles.paneLabel}>Document</span>

                        {doc === undefined ? (
                            <div
                                role="button"
                                tabIndex={0}
                                aria-label="Drop a PDF to interpret"
                                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ""}`}
                                onClick={() => inputRef.current?.click()}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        inputRef.current?.click()
                                    }
                                }}
                            >
                                <span className={styles.glyphHalo} aria-hidden="true">
                                    <span className={styles.glyph} />
                                </span>
                                <p className={styles.dropTitle}>Drop a PDF</p>
                                <p className={styles.dropHint}>or click to browse</p>
                            </div>
                        ) : (
                            <div className={styles.previewFrame}>
                                <div className={styles.fileBar}>
                                    <span className={styles.fileName}>{doc.name}</span>
                                    <button
                                        type="button"
                                        className={styles.replaceButton}
                                        disabled={busy}
                                        onClick={() => inputRef.current?.click()}
                                    >
                                        Replace
                                    </button>
                                </div>
                                <div className={styles.previewBody}>
                                    <iframe
                                        title={doc.name}
                                        className={styles.preview}
                                        src={`${doc.url}#toolbar=0&navpanes=0`}
                                    />
                                    {busy && (
                                        <div className={styles.scanOverlay} aria-hidden="true">
                                            <span className={styles.scanBeam} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <input
                            ref={inputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            hidden
                            onChange={onPick}
                        />
                    </section>

                    <section className={styles.pane}>
                        <div className={styles.paneLabelRow}>
                            <span className={styles.paneLabel}>Reading</span>
                            <span className={styles.statusChip}>
                                <span
                                    className={`${styles.statusDot} ${
                                        busy
                                            ? styles.statusDotBusy
                                            : interpretation !== undefined
                                              ? styles.statusDotDone
                                              : ""
                                    }`}
                                    aria-hidden="true"
                                />
                                {status}
                            </span>
                        </div>

                        {busy ? (
                            <div className={styles.analyzing}>
                                <div className={styles.tickerRow}>
                                    <span className={styles.thinkingDot} aria-hidden="true" />
                                    <div className={styles.ticker} role="status">
                                        <div className={styles.tickerTrack}>
                                            {[...THINKING_PHASES, THINKING_PHASES[0]].map((phrase, index) => (
                                                <span key={index} className={styles.tickerLine}>
                                                    {phrase}…
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.skeleton} aria-hidden="true">
                                    <span className={`${styles.bone} ${styles.boneBadge}`} />
                                    <span className={`${styles.bone} ${styles.boneTitle}`} />
                                    <span className={`${styles.bone} ${styles.boneLineFull}`} />
                                    <span className={`${styles.bone} ${styles.boneLineFull}`} />
                                    <span className={`${styles.bone} ${styles.boneLineShort}`} />
                                    <span className={styles.skeletonGap} />
                                    <span className={`${styles.bone} ${styles.boneChip}`} />
                                    <span className={`${styles.bone} ${styles.boneChip}`} />
                                    <span className={`${styles.bone} ${styles.boneChip}`} />
                                </div>
                            </div>
                        ) : error !== undefined ? (
                            <p className={styles.errorText}>{error}</p>
                        ) : interpretation !== undefined ? (
                            <article className={styles.result}>
                                <div className={styles.resultHead} style={{ animationDelay: "0ms" }}>
                                    <span className={styles.typeBadge}>{interpretation.documentType}</span>
                                    <span className={styles.pageCount}>
                                        {interpretation.pageCount} page
                                        {interpretation.pageCount === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {interpretation.title !== null && interpretation.title !== undefined && (
                                    <h1 className={styles.verdict} style={{ animationDelay: "140ms" }}>
                                        {interpretation.title}
                                    </h1>
                                )}

                                <p className={styles.summary} style={{ animationDelay: "280ms" }}>
                                    {interpretation.summary}
                                </p>

                                {interpretation.keyPoints.length > 0 && (
                                    <div className={styles.section} style={{ animationDelay: "420ms" }}>
                                        <h2 className={styles.sectionLabel}>Key points</h2>
                                        <ul className={styles.keyPointList}>
                                            {interpretation.keyPoints.map((point) => (
                                                <li key={point} className={styles.keyPoint}>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {interpretation.fields.length > 0 && (
                                    <div className={styles.section} style={{ animationDelay: "560ms" }}>
                                        <h2 className={styles.sectionLabel}>Fields</h2>
                                        <dl className={styles.fieldList}>
                                            {interpretation.fields.map((field) => (
                                                <div
                                                    key={`${field.label}-${field.value}`}
                                                    className={styles.fieldRow}
                                                >
                                                    <dt className={styles.fieldLabel}>{field.label}</dt>
                                                    <dd className={styles.fieldValue}>{field.value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                )}

                                <div className={styles.againRow} style={{ animationDelay: "700ms" }}>
                                    <Button variant="secondary" size="sm" onClick={reset}>
                                        Read another
                                    </Button>
                                </div>
                            </article>
                        ) : (
                            <div className={styles.ghost} aria-hidden="true">
                                <span className={`${styles.ghostBone} ${styles.ghostBadge}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostTitle}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostLineFull}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostLineFull}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostLineShort}`} />
                                <span className={styles.skeletonGap} />
                                <span className={`${styles.ghostBone} ${styles.ghostLineFull}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostLineFull}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostLineShort}`} />
                                <span className={styles.skeletonGap} />
                                <span className={`${styles.ghostBone} ${styles.ghostChip}`} />
                                <span className={`${styles.ghostBone} ${styles.ghostChip}`} />
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppShell>
    )
}
