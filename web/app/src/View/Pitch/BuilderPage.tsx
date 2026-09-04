import { deriveStorageEndpoint, putUploadBytes, resolveStorageUrl } from "@base/core"
import {
    Button,
    ChartCard,
    EmptyState,
    Input,
    Label,
    Spinner,
    StatCard,
    StatCardRow,
    Switch,
    useToast,
} from "@ui"
import React, { useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
    useCreateUploadMutation,
    useFileUrlLazyQuery,
    useFinalizeUploadMutation,
    usePitchDeckDataQuery,
    usePitchDeckOutlineQuery,
    usePitchExportDeckPdfMutation,
    usePitchUpdateDeckMutation,
    usePitchUpdateSlideMutation,
} from "../../generated/graphql/types"
import {
    accentPresets,
    formatPitchMoney,
    formatPitchMonth,
    isValidAccent,
    pitchPaths,
    PitchDeckDataNode,
    PitchSlideNode,
    runwayLabel,
    slideKindLabels,
} from "./pitchShared"
import * as shared from "./pitchStyles.css"
import * as styles from "./BuilderPage.styles.css"

const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

/**
 * The deck builder (manifest destination `/builder?deck=<id>`, packs/pitch):
 * brand controls, live chart previews from the books, slide-by-slide copy
 * editing, and PDF export through the documents kernel.
 */
export default function BuilderPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const deckId = searchParams.get("deck")

    if (deckId === null) {
        return (
            <section className={shared.page}>
                <EmptyState
                    title="Pick a deck"
                    description="Open a deck from the roster to edit it here."
                    action={<Button onClick={() => navigate(pitchPaths.decks)}>Go to decks</Button>}
                />
            </section>
        )
    }
    return <DeckBuilder deckId={deckId} />
}

function DeckBuilder({ deckId }: { deckId: string }): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const deckQuery = usePitchDeckOutlineQuery({ variables: { deckId } })
    const dataQuery = usePitchDeckDataQuery()
    const [exportPdf, exportState] = usePitchExportDeckPdfMutation()
    const [fetchFileUrl] = useFileUrlLazyQuery()

    const download = async (): Promise<void> => {
        try {
            const result = await exportPdf({
                variables: { input: { idempotencyKey: crypto.randomUUID(), deckId } },
            })
            const uploadId = result.data?.pitchExportDeckPdf.id
            if (uploadId === undefined) {
                throw new Error("The export did not produce a file.")
            }
            const urlResult = await fetchFileUrl({ variables: { uploadId } })
            const url = urlResult.data?.fileUrl.url
            if (url === undefined) {
                throw new Error("The download link could not be created.")
            }
            window.open(resolveStorageUrl(storageEndpoint(), url), "_blank", "noopener")
        } catch (caught) {
            toast.publish({
                title: "Export failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (deckQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    const deck = deckQuery.data?.pitchDeck
    if (deckQuery.error || deck === undefined) {
        return (
            <section className={shared.page}>
                <EmptyState
                    title="No such deck"
                    description={deckQuery.error?.message}
                    action={<Button onClick={() => navigate(pitchPaths.decks)}>Go to decks</Button>}
                />
            </section>
        )
    }

    const data = dataQuery.data?.pitchDeckData ?? undefined

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>{deck.name}</h1>
                <p className={shared.subtitle}>
                    {deck.companyName}
                    {deck.tagline ? ` — ${deck.tagline}` : ""}
                </p>
            </header>

            <div className={shared.row}>
                <Button onClick={() => void download()} disabled={exportState.loading || data === undefined}>
                    {exportState.loading ? "Exporting..." : "Export PDF"}
                </Button>
                <Button variant="secondary" onClick={() => navigate(pitchPaths.decks)}>
                    All decks
                </Button>
                {data === undefined ? (
                    <p className={shared.mutedText}>
                        Connect your books to fill the charts and enable export.
                    </p>
                ) : null}
            </div>

            <BrandCard deck={deck} />

            {data === undefined ? (
                <div className={shared.card}>
                    <h2 className={shared.cardTitle}>Live numbers</h2>
                    <p className={shared.mutedText}>
                        The traction, revenue, margins, and runway slides fill themselves from your accounting
                        connection.
                    </p>
                    <div className={shared.row}>
                        <Button onClick={() => navigate(pitchPaths.books)}>Connect books</Button>
                    </div>
                </div>
            ) : (
                <LivePreview data={data} />
            )}

            <div className={shared.card}>
                <h2 className={shared.cardTitle}>Slides</h2>
                <p className={shared.mutedText}>
                    Edit the copy; chart slides pull their numbers live at export. Toggle a slide off to leave
                    it out of the PDF.
                </p>
                <div className={styles.slideList}>
                    {deck.slides.map((slide) => (
                        <SlideRow key={slide.id} slide={slide} />
                    ))}
                </div>
            </div>
        </section>
    )
}

function BrandCard({
    deck,
}: {
    deck: {
        id: string
        companyName: string
        tagline?: string | null
        accentColor: string
        logoUploadId?: string | null
    }
}): React.ReactElement {
    const toast = useToast()
    const [updateDeck, updateState] = usePitchUpdateDeckMutation()
    const [createUpload] = useCreateUploadMutation()
    const [finalizeUpload] = useFinalizeUploadMutation()
    const logoInputRef = useRef<HTMLInputElement>(null)
    const [logoBusy, setLogoBusy] = useState(false)

    const [companyName, setCompanyName] = useState(deck.companyName)
    const [tagline, setTagline] = useState(deck.tagline ?? "")

    const save = async (changes: {
        companyName?: string
        tagline?: string
        accentColor?: string
        logoUploadId?: string
    }): Promise<void> => {
        try {
            await updateDeck({
                variables: { input: { deckId: deck.id, ...changes } },
                refetchQueries: ["PitchDeckOutline"],
            })
        } catch (caught) {
            toast.publish({
                title: "Saving failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const uploadLogo = async (file: File): Promise<void> => {
        if (!file.type.startsWith("image/")) {
            toast.publish({ title: "Logos must be image files", tone: "danger" })
            return
        }
        setLogoBusy(true)
        try {
            const slotResult = await createUpload({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: {
                            contentType: file.type,
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
            await save({ logoUploadId: slot.uploadId })
            toast.publish({ title: "Logo uploaded", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Logo upload failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        } finally {
            setLogoBusy(false)
        }
    }

    const brandDirty = companyName.trim() !== deck.companyName || tagline.trim() !== (deck.tagline ?? "")

    return (
        <div className={shared.card}>
            <h2 className={shared.cardTitle}>Brand</h2>
            <div className={styles.brandRow}>
                <div className={styles.brandField}>
                    <Label htmlFor="pitch-brand-company">Company</Label>
                    <Input
                        id="pitch-brand-company"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                    />
                </div>
                <div className={styles.brandField}>
                    <Label htmlFor="pitch-brand-tagline">Tagline</Label>
                    <Input
                        id="pitch-brand-tagline"
                        value={tagline}
                        onChange={(event) => setTagline(event.target.value)}
                    />
                </div>
                <Button
                    disabled={!brandDirty || companyName.trim() === "" || updateState.loading}
                    onClick={() => void save({ companyName: companyName.trim(), tagline: tagline.trim() })}
                >
                    Save
                </Button>
            </div>
            <div className={styles.brandRow}>
                <div className={styles.brandField}>
                    <Label>Accent</Label>
                    <div className={styles.swatchRow}>
                        {accentPresets.map((hex) => (
                            <button
                                key={hex}
                                type="button"
                                aria-label={`Accent ${hex}`}
                                className={
                                    hex === deck.accentColor
                                        ? `${styles.swatch} ${styles.swatchActive}`
                                        : styles.swatch
                                }
                                style={{ background: hex }}
                                onClick={() => {
                                    if (isValidAccent(hex)) {
                                        void save({ accentColor: hex })
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div className={styles.brandField}>
                    <Label>Logo</Label>
                    <div className={shared.row}>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={logoBusy}
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {logoBusy ? "Uploading..." : deck.logoUploadId ? "Replace logo" : "Upload logo"}
                        </Button>
                        {deck.logoUploadId ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => void save({ logoUploadId: "" })}
                            >
                                Remove
                            </Button>
                        ) : (
                            <span className={shared.mutedText}>Shows on the cover slide.</span>
                        )}
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                event.target.value = ""
                                if (file !== undefined) {
                                    void uploadLogo(file)
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function LivePreview({ data }: { data: PitchDeckDataNode }): React.ReactElement {
    const money = (minorUnits: number): string => formatPitchMoney(minorUnits, data.currency)
    return (
        <div className={shared.card}>
            <div className={shared.cardHeader}>
                <h2 className={shared.cardTitle}>Live numbers — {data.companyName}</h2>
            </div>
            <StatCardRow>
                <StatCard
                    label="Trailing 12-month revenue"
                    value={money(data.trailingTwelveMonthRevenueMinorUnits)}
                    tone="accent"
                />
                <StatCard label="Revenue growth" value={`${data.revenueGrowthPercent}%`} />
                <StatCard label="Net margin" value={`${data.netMarginPercent}%`} tone="success" />
                <StatCard label="Runway" value={runwayLabel(data.runwayMonths)} />
            </StatCardRow>
            <div className={styles.chartGrid}>
                <ChartCard
                    kind="bar"
                    title="Revenue"
                    description="Monthly revenue, trailing thirteen months"
                    valueFormatter={(value) => money(Math.round(value))}
                    series={[
                        {
                            id: "revenue",
                            label: "Revenue",
                            points: data.revenueSeries.map((point) => ({
                                x: formatPitchMonth(point.month),
                                y: point.minorUnits,
                            })),
                        },
                    ]}
                />
                <ChartCard
                    kind="line"
                    title="Net income"
                    description="Income minus expenses, by month"
                    valueFormatter={(value) => money(Math.round(value))}
                    series={[
                        {
                            id: "net",
                            label: "Net income",
                            points: data.netIncomeSeries.map((point) => ({
                                x: formatPitchMonth(point.month),
                                y: point.minorUnits,
                            })),
                        },
                    ]}
                />
                <ChartCard
                    kind="area"
                    title="Cash"
                    description="Month-end cash on hand"
                    valueFormatter={(value) => money(Math.round(value))}
                    series={[
                        {
                            id: "cash",
                            label: "Cash",
                            points: data.cashSeries.map((point) => ({
                                x: formatPitchMonth(point.month),
                                y: point.minorUnits,
                            })),
                        },
                    ]}
                />
            </div>
        </div>
    )
}

function SlideRow({ slide }: { slide: PitchSlideNode }): React.ReactElement {
    const toast = useToast()
    const [updateSlide, updateState] = usePitchUpdateSlideMutation()
    const [title, setTitle] = useState(slide.title)
    const [body, setBody] = useState(slide.body)

    const dirty = title.trim() !== slide.title || body.trim() !== slide.body

    const save = async (changes: { title?: string; body?: string; included?: boolean }): Promise<void> => {
        try {
            await updateSlide({
                variables: { input: { slideId: slide.id, ...changes } },
                refetchQueries: ["PitchDeckOutline"],
            })
        } catch (caught) {
            toast.publish({
                title: "Saving the slide failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    return (
        <div className={slide.included ? styles.slideItem : `${styles.slideItem} ${styles.slideExcluded}`}>
            <div className={styles.slideHead}>
                <span className={styles.slideKind}>{slideKindLabels[slide.kind]}</span>
                <Switch
                    checked={slide.included}
                    disabled={slide.kind === "COVER"}
                    aria-label={`Include the ${slideKindLabels[slide.kind]} slide`}
                    onCheckedChange={(checked) => void save({ included: checked })}
                />
            </div>
            <div className={styles.slideFields}>
                <Input
                    value={title}
                    aria-label="Slide title"
                    onChange={(event) => setTitle(event.target.value)}
                />
                <textarea
                    className={styles.slideBody}
                    value={body}
                    rows={3}
                    aria-label="Slide body"
                    onChange={(event) => setBody(event.target.value)}
                />
                {dirty ? (
                    <div className={shared.row}>
                        <Button
                            size="sm"
                            disabled={title.trim() === "" || updateState.loading}
                            onClick={() => void save({ title: title.trim(), body: body.trim() })}
                        >
                            {updateState.loading ? "Saving..." : "Save slide"}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setTitle(slide.title)
                                setBody(slide.body)
                            }}
                        >
                            Revert
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
