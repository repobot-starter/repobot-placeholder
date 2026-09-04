import * as RadixDialog from "@radix-ui/react-dialog"
import React from "react"
import { marketingSrc, type MarketingImageSource } from "./marketingContent"
import * as styles from "./MarketingLightbox.styles.css"

export interface MarketingLightboxItem {
    src: string
    alt: string
    width?: number
    height?: number
    srcSet?: MarketingImageSource[]
    caption?: string
}

export interface MarketingLightboxProps {
    items: MarketingLightboxItem[]
    /** The open image's index; `null` renders nothing (closed). */
    index: number | null
    onIndexChange: (index: number | null) => void
    /** Selection mode (client proofing): which lightbox indexes are selected. */
    selectedIndexes?: ReadonlySet<number>
    /** Present = the meta bar gains a select/deselect toggle for the open image. */
    onToggleSelect?: (index: number) => void
}

function Chevron({ direction }: { direction: "left" | "right" }): React.ReactElement {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d={direction === "left" ? "M10 2L4 8L10 14" : "M6 2L12 8L6 14"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function CloseIcon(): React.ReactElement {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function fullSrcSet(item: MarketingLightboxItem): string | undefined {
    if (item.srcSet === undefined || item.srcSet.length === 0) {
        return undefined
    }
    return item.srcSet.map((source) => `${marketingSrc(source.src)} ${source.width}w`).join(", ")
}

/**
 * The photograph viewing room: a near-black full-viewport overlay built on
 * Radix Dialog (portal, focus trap, Escape-to-close for free) with
 * arrow-key and swipe navigation, caption + counter, and adjacent-image
 * preloading so paging feels instant. Galleries opt in via their
 * `lightbox` content flag; state stays in the section.
 */
export function MarketingLightbox({
    items,
    index,
    onIndexChange,
    selectedIndexes,
    onToggleSelect,
}: MarketingLightboxProps): React.ReactElement | null {
    const touchStartX = React.useRef<number | null>(null)
    const count = items.length
    const open = index !== null && count > 0

    const step = React.useCallback(
        (delta: number) => {
            if (index === null || count === 0) {
                return
            }
            onIndexChange((index + delta + count) % count)
        },
        [index, count, onIndexChange],
    )

    // Warm the neighbors so paging never waits on the network.
    React.useEffect(() => {
        if (index === null || count < 2) {
            return
        }
        for (const neighbor of [(index + 1) % count, (index - 1 + count) % count]) {
            const item = items[neighbor]
            if (item === undefined) {
                continue
            }
            const image = new Image()
            const srcSet = fullSrcSet(item)
            if (srcSet !== undefined) {
                image.srcset = srcSet
                image.sizes = "100vw"
            }
            image.src = marketingSrc(item.src)
        }
    }, [index, count, items])

    if (!open) {
        return null
    }
    const item = items[index]
    if (item === undefined) {
        return null
    }
    const srcSet = fullSrcSet(item)

    return (
        <RadixDialog.Root
            open
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onIndexChange(null)
                }
            }}
        >
            <RadixDialog.Portal>
                <RadixDialog.Overlay className={styles.overlay} />
                <RadixDialog.Content
                    className={styles.content}
                    aria-describedby={undefined}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowRight") {
                            event.preventDefault()
                            step(1)
                        } else if (event.key === "ArrowLeft") {
                            event.preventDefault()
                            step(-1)
                        }
                    }}
                    onTouchStart={(event) => {
                        touchStartX.current = event.touches[0]?.clientX ?? null
                    }}
                    onTouchEnd={(event) => {
                        const startX = touchStartX.current
                        touchStartX.current = null
                        const endX = event.changedTouches[0]?.clientX
                        if (startX === null || endX === undefined) {
                            return
                        }
                        const delta = endX - startX
                        if (Math.abs(delta) > 48) {
                            step(delta < 0 ? 1 : -1)
                        }
                    }}
                >
                    <RadixDialog.Title
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clipPath: "inset(50%)",
                        }}
                    >
                        {item.caption ?? item.alt}
                    </RadixDialog.Title>
                    <div className={styles.stage}>
                        <img
                            key={index}
                            className={styles.image}
                            src={marketingSrc(item.src)}
                            srcSet={srcSet}
                            sizes={srcSet !== undefined ? "100vw" : undefined}
                            alt={item.alt}
                            decoding="async"
                        />
                    </div>
                    <div className={styles.meta}>
                        {item.caption !== undefined ? <p className={styles.caption}>{item.caption}</p> : null}
                        {onToggleSelect !== undefined ? (
                            <button
                                type="button"
                                className={
                                    selectedIndexes?.has(index) === true
                                        ? `${styles.selectButton} ${styles.selectButtonSelected}`
                                        : styles.selectButton
                                }
                                aria-pressed={selectedIndexes?.has(index) === true}
                                onClick={() => onToggleSelect(index)}
                            >
                                {selectedIndexes?.has(index) === true ? "Selected ✓" : "Select"}
                            </button>
                        ) : null}
                        {count > 1 ? (
                            <span className={styles.counter}>
                                {index + 1} / {count}
                            </span>
                        ) : null}
                    </div>
                    {count > 1 ? (
                        <>
                            <button
                                type="button"
                                className={styles.prev}
                                aria-label="Previous image"
                                onClick={() => step(-1)}
                            >
                                <Chevron direction="left" />
                            </button>
                            <button
                                type="button"
                                className={styles.next}
                                aria-label="Next image"
                                onClick={() => step(1)}
                            >
                                <Chevron direction="right" />
                            </button>
                        </>
                    ) : null}
                    <RadixDialog.Close className={styles.close} aria-label="Close">
                        <CloseIcon />
                    </RadixDialog.Close>
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    )
}
