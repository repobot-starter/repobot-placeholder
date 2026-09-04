import {
    deriveDocumentsEndpoint,
    DocumentPageSize,
    DocumentTemplateSummary,
    fetchDocumentTemplates,
} from "@base/core"
import { AppShell, type AppShellNavItem, type AppShellNavSection } from "@ui"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { generateAuthenticatedDocumentPdf } from "../../Config/documentsAuth"
import { GenerateModal, GenerationState } from "./GenerateModal"
import * as styles from "./PdfGeneratorPage.styles.css"
import { missingRequired, parseDocumentJson, seedJson } from "./pdfForm"
import { buildPreviewHtml } from "./preview"
import { starterFor } from "./starters"

/**
 * The pdf pack's home surface: an editor-and-preview workbench over the
 * documents kernel. The left pane live-edits the selected template's JSON
 * data, CSS, and HTML; the right pane renders them onto a paper preview.
 * Generate posts the JSON to the kernel (POST /generate) and stages the
 * download in a modal — the PDF itself is rendered server-side from the
 * repo's template files. The chrome is the kernel AppShell (the old topbar's
 * document-type picker became the shell nav; Generate lives on the preview
 * pane's toolbar), so the theme contract restyles the press too. See
 * packs/pdf/PACK.md and docs/documents.md.
 */

type EditorTab = "json" | "css" | "html"

interface EditorDoc {
    json: string
    css: string
    html: string
}

const TABS: { id: EditorTab; label: string; dotClass: string }[] = [
    { id: "json", label: "data.json", dotClass: styles.tabDotJson },
    { id: "css", label: "styles.css", dotClass: styles.tabDotCss },
    { id: "html", label: "template.html", dotClass: styles.tabDotHtml },
]

/** CSS-pixel paper widths at 96dpi, matching the templates' own page CSS. */
const PAPER_WIDTH_PX: Record<DocumentPageSize, number> = {
    Letter: 816,
    A4: 794,
    "Letter-landscape": 1056,
    "A4-landscape": 1123,
}

const PAGE_SIZE_LABEL: Record<DocumentPageSize, string> = {
    Letter: "Letter · 8.5 × 11 in",
    A4: "A4 · 210 × 297 mm",
    "Letter-landscape": "Letter landscape · 11 × 8.5 in",
    "A4-landscape": "A4 landscape · 297 × 210 mm",
}

const documentsEndpoint = (): string => deriveDocumentsEndpoint(import.meta.env.VITE_GRAPHQL_URL)

/** The old wordmark's rotated lamp-light square, worn as the shell brand mark. */
function PressBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="6.2" y="6.2" width="7.6" height="7.6" fill="currentColor" transform="rotate(45 10 10)" />
        </svg>
    )
}

export default function PdfGeneratorPage(): React.ReactElement {
    const [templates, setTemplates] = useState<DocumentTemplateSummary[] | undefined>(undefined)
    const [loadError, setLoadError] = useState<string | undefined>(undefined)
    const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined)
    const [docs, setDocs] = useState<Record<string, EditorDoc>>({})
    const [tab, setTab] = useState<EditorTab>("json")
    const [srcDoc, setSrcDoc] = useState<string>("")
    const [previewScale, setPreviewScale] = useState<number | undefined>(undefined)
    const [modal, setModal] = useState<GenerationState | { kind: "closed" }>({ kind: "closed" })

    useEffect(() => {
        let cancelled = false
        fetchDocumentTemplates(documentsEndpoint())
            .then((fetched) => {
                if (cancelled) {
                    return
                }
                setTemplates(fetched)
                const seeded: Record<string, EditorDoc> = {}
                for (const candidate of fetched) {
                    const starter = starterFor(candidate)
                    seeded[candidate.key] = {
                        json: seedJson(candidate),
                        css: starter.css,
                        html: starter.html,
                    }
                }
                setDocs(seeded)
                setSelectedKey(fetched[0]?.key)
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setLoadError(error instanceof Error ? error.message : "Loading the templates failed.")
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const template = useMemo(
        () => templates?.find((candidate) => candidate.key === selectedKey),
        [templates, selectedKey],
    )
    const doc = selectedKey !== undefined ? docs[selectedKey] : undefined
    const parsed = useMemo(() => (doc === undefined ? undefined : parseDocumentJson(doc.json)), [doc])
    const problems = useMemo(
        () => (template !== undefined && parsed?.kind === "ok" ? missingRequired(template, parsed.data) : []),
        [template, parsed],
    )

    // The live preview, debounced. Invalid JSON keeps the last good render
    // on the paper — the status bar carries the parse error instead.
    useEffect(() => {
        if (doc === undefined) {
            return
        }
        const timer = window.setTimeout(() => {
            const current = parseDocumentJson(doc.json)
            if (current.kind === "ok") {
                setSrcDoc(buildPreviewHtml(doc.html, doc.css, current.data))
            }
        }, 220)
        return () => window.clearTimeout(timer)
    }, [doc])

    const updateDoc = (patch: Partial<EditorDoc>): void => {
        if (selectedKey === undefined) {
            return
        }
        setDocs((current) => {
            const existing = current[selectedKey]
            return existing === undefined ? current : { ...current, [selectedKey]: { ...existing, ...patch } }
        })
    }

    const resetDoc = (): void => {
        if (template === undefined) {
            return
        }
        const starter = starterFor(template)
        updateDoc({ json: seedJson(template), css: starter.css, html: starter.html })
    }

    const startGeneration = (): void => {
        if (template === undefined || doc === undefined) {
            return
        }
        const current = parseDocumentJson(doc.json)
        if (current.kind === "error") {
            return
        }
        setModal({ kind: "working" })
        void (async () => {
            try {
                const generated = await generateAuthenticatedDocumentPdf(documentsEndpoint(), {
                    templateKey: template.key,
                    overrides: current.data,
                })
                const url = URL.createObjectURL(generated.blob)
                setModal((state) => {
                    if (state.kind !== "working") {
                        URL.revokeObjectURL(url)
                        return state
                    }
                    return { kind: "success", fileName: generated.fileName, url }
                })
            } catch (error) {
                const message = error instanceof Error ? error.message : "Generating the PDF failed."
                setModal((state) => (state.kind === "working" ? { kind: "error", message } : state))
            }
        })()
    }

    const closeModal = (): void => {
        setModal((state) => {
            if (state.kind === "success") {
                URL.revokeObjectURL(state.url)
            }
            return { kind: "closed" }
        })
    }

    const canGenerate =
        template !== undefined && parsed?.kind === "ok" && problems.length === 0 && modal.kind === "closed"

    // The document types are the press's only navigation, so they ride the
    // shell nav (the old topbar picker); every other control is in-page.
    const navSections = useMemo((): AppShellNavSection[] => {
        if (templates === undefined || templates.length === 0) {
            return []
        }
        return [
            {
                id: "documents",
                title: "Documents",
                items: templates.map((candidate): AppShellNavItem => ({
                    id: candidate.key,
                    label: candidate.name,
                })),
            },
        ]
    }, [templates])

    const onNavSelect = useCallback((item: AppShellNavItem): void => {
        setSelectedKey(item.id)
    }, [])

    return (
        <AppShell
            title={
                <>
                    PDF Generator <span className={styles.titleSub}>/ press room</span>
                </>
            }
            brandIcon={<PressBrandIcon />}
            sections={navSections}
            activeItemId={selectedKey}
            onItemSelect={onNavSelect}
        >
            <div className={styles.page}>
                {templates === undefined && loadError === undefined ? (
                    <div className={styles.loadingWrap}>
                        <span className={styles.loadingSpinner} aria-hidden="true" />
                        Warming up the press
                    </div>
                ) : loadError !== undefined ? (
                    <div className={styles.loadingWrap}>
                        <p className={styles.loadErrorText}>{loadError}</p>
                    </div>
                ) : (
                    <div className={styles.workbench}>
                        <section className={styles.editorPane} aria-label="Document source">
                            <div className={styles.editorTabs}>
                                {TABS.map((candidate) => (
                                    <button
                                        key={candidate.id}
                                        type="button"
                                        className={`${styles.editorTab} ${
                                            candidate.id === tab ? styles.editorTabActive : ""
                                        }`}
                                        onClick={() => setTab(candidate.id)}
                                    >
                                        <span className={candidate.dotClass} aria-hidden="true" />
                                        {candidate.label}
                                    </button>
                                ))}
                                <button type="button" className={styles.resetButton} onClick={resetDoc}>
                                    Reset
                                </button>
                            </div>
                            {doc !== undefined && (
                                <CodeEditor
                                    key={`${selectedKey ?? ""}:${tab}`}
                                    value={doc[tab]}
                                    onChange={(next) => updateDoc({ [tab]: next })}
                                />
                            )}
                            <div className={styles.statusBar}>
                                <span className={styles.statusOk}>
                                    {doc !== undefined
                                        ? `${selectedKey ?? ""}/${TABS.find((candidate) => candidate.id === tab)?.label ?? ""} · ${countLines(doc[tab])} lines`
                                        : ""}
                                </span>
                                {parsed?.kind === "error" ? (
                                    <span className={styles.statusProblem}>{parsed.message}</span>
                                ) : problems.length > 0 ? (
                                    <span className={styles.statusProblem}>
                                        Required: {problems.join(", ")}
                                    </span>
                                ) : (
                                    <span className={styles.statusOk}>
                                        <span className={styles.statusDot} aria-hidden="true" />
                                        ready to print
                                    </span>
                                )}
                            </div>
                        </section>

                        <section className={styles.previewPane} aria-label="Document preview">
                            {/* The pane's toolbar carries the press's one action, so
                            every shell variant keeps the Generate moment. */}
                            <div className={styles.previewHeader}>
                                <span>Live preview</span>
                                <div className={styles.previewMeta}>
                                    <span className={styles.previewChip}>
                                        {template !== undefined ? PAGE_SIZE_LABEL[template.pageSize] : ""}
                                        {previewScale !== undefined
                                            ? ` · ${Math.round(previewScale * 100)}%`
                                            : ""}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.generateCta}
                                        onClick={startGeneration}
                                        disabled={!canGenerate}
                                    >
                                        Generate PDF
                                    </button>
                                </div>
                            </div>
                            <PaperPreview
                                srcDoc={srcDoc}
                                paperWidth={PAPER_WIDTH_PX[template?.pageSize ?? "Letter"]}
                                onScaleChange={setPreviewScale}
                            />
                        </section>
                    </div>
                )}

                {modal.kind !== "closed" && (
                    <GenerateModal state={modal} onClose={closeModal} onRetry={startGeneration} />
                )}
            </div>
        </AppShell>
    )
}

//
// The code surface: a plain textarea dressed as an editor — synced line
// gutter, monospace metrics, Tab inserting spaces.
//

function CodeEditor({
    value,
    onChange,
}: {
    value: string
    onChange: (next: string) => void
}): React.ReactElement {
    const gutterRef = useRef<HTMLPreElement>(null)
    const lineNumbers = useMemo(() => {
        const count = countLines(value)
        let numbers = ""
        for (let line = 1; line <= count; line += 1) {
            numbers += `${line}\n`
        }
        return numbers
    }, [value])

    return (
        <div className={styles.editorBody}>
            <pre ref={gutterRef} className={styles.gutter} aria-hidden="true">
                {lineNumbers}
            </pre>
            <textarea
                className={styles.codeArea}
                value={value}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                wrap="off"
                onChange={(event) => onChange(event.target.value)}
                onScroll={(event) => {
                    if (gutterRef.current !== null) {
                        gutterRef.current.scrollTop = event.currentTarget.scrollTop
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === "Tab" && !event.shiftKey) {
                        event.preventDefault()
                        const area = event.currentTarget
                        area.setRangeText("  ", area.selectionStart, area.selectionEnd, "end")
                        onChange(area.value)
                    }
                }}
            />
        </div>
    )
}

//
// The paper: a sandboxed iframe rendered at true page width and scaled to
// the pasteboard, its height measured from the document so multi-page
// previews (the deck) scroll naturally.
//

function PaperPreview({
    srcDoc,
    paperWidth,
    onScaleChange,
}: {
    srcDoc: string
    paperWidth: number
    onScaleChange: (scale: number) => void
}): React.ReactElement {
    const hostRef = useRef<HTMLDivElement>(null)
    const frameRef = useRef<HTMLIFrameElement>(null)
    const [scale, setScale] = useState(0.6)
    const [paperHeight, setPaperHeight] = useState(1056)

    useEffect(() => {
        const host = hostRef.current
        if (host === null) {
            return
        }
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0
            if (width > 0) {
                const next = Math.min(1, Math.max(0.25, (width - 72) / paperWidth))
                setScale(next)
                onScaleChange(next)
            }
        })
        observer.observe(host)
        return () => observer.disconnect()
        // onScaleChange is a state setter and stable across renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paperWidth])

    const measure = (): void => {
        const frameDocument = frameRef.current?.contentDocument
        if (frameDocument === null || frameDocument === undefined) {
            return
        }
        // body.scrollHeight tracks the content rather than the frame's own
        // viewport, so the paper shrinks back when pages are removed; the
        // pad absorbs the body's default margins.
        const height = frameDocument.body?.scrollHeight ?? 0
        if (height > 0) {
            setPaperHeight(height + 24)
        }
    }

    return (
        <div ref={hostRef} className={styles.pasteboard}>
            <div
                className={styles.paperWrap}
                style={{ width: paperWidth * scale, height: paperHeight * scale }}
            >
                <iframe
                    ref={frameRef}
                    title="Document preview"
                    className={styles.paperFrame}
                    sandbox="allow-same-origin"
                    srcDoc={srcDoc}
                    onLoad={measure}
                    style={{ width: paperWidth, height: paperHeight, transform: `scale(${scale})` }}
                />
            </div>
        </div>
    )
}

function countLines(text: string): number {
    return text.split("\n").length
}
