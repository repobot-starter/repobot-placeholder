import React from "react"
import { type MarketingMedia } from "./marketingContent"
import { marketingItemStamp, marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import { MarketingIcon, isMarketingIconName, type MarketingIconName } from "./marketingIcons"
import { MarketingMessageThread } from "./MarketingMessageThread"
import * as styles from "./MarketingSteps.styles.css"

export type MarketingStepsVariant = "numbered-cards" | "timeline" | "horizontal-rail" | "message-thread"

export interface MarketingStep {
    title: string
    description: string
    /**
     * `horizontal-rail`: the short mark on the connecting line in place of
     * the step number — a month ("MAR"), a phase code ("P2"), a week. Keep
     * it to a few characters; it's set in small monospace.
     * `timeline` (photographic): the mark in the margin beside the line —
     * a clock time ("6:30"), a duration ("15 min").
     */
    label?: string
    /**
     * `horizontal-rail`: the step's photograph (4:3 crop).
     * `timeline`: the step's lead photograph — any step with media (or
     * frames) turns the timeline photographic (see `frames`).
     * `message-thread`: a photo attached under the bubble's text.
     */
    media?: MarketingMedia
    /**
     * `timeline` only: smaller photographs of the same step set beside the
     * lead photograph, a contact strip. The other variants ignore them.
     */
    frames?: MarketingMedia[]
    /**
     * `horizontal-rail` only: the time the step takes ("15 min"), set under
     * its title — so a rail can carry the step number on the line and the
     * minutes with the copy.
     */
    duration?: string
    /**
     * `message-thread` only — which side of the conversation sends this
     * step: `start` (left, a surface bubble, the default) or `end` (right,
     * in the accent — the conventional "sent" side, usually the business's
     * own voice). The other variants ignore the chat fields below.
     */
    side?: "start" | "end"
    /** `message-thread` only: the bubble's time label, e.g. "10:28 AM". */
    time?: string
    /** `message-thread` only: a small confirmation chip, e.g. "Approved". */
    chip?: string
    /**
     * `horizontal-rail` only: a named icon set on the line in place of the
     * step's dot — the journey read as pictograms ("users" for the consult,
     * "calendar" for the visits). The label still prints beside it.
     */
    icon?: MarketingIconName
}

export interface MarketingStepsContent {
    kicker?: string
    title?: string
    /** `message-thread` only: a line of copy under the title. */
    intro?: string
    /**
     * `message-thread` only: the phone header over the conversation — who
     * the thread is with ("Straight Pipe") and a detail ("Pasadena, CA").
     */
    thread?: { name: string; detail?: string }
    steps: MarketingStep[]
}

export interface MarketingStepsProps extends MarketingStepsContent {
    variant?: MarketingStepsVariant
    anchorId?: string
}

function RailMedia({ media, title }: { media: MarketingMedia; title: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${title}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.railImg} />
    }
    return (
        <MarketingImage
            className={styles.railImg}
            {...marketingImageProps(media)}
            sizes="(min-width: 980px) 22vw, (min-width: 640px) 45vw, 80vw"
        />
    )
}

/**
 * The build log: steps as photo cards along one thin connecting line, read
 * left to right, each hung from a small mark on the line (its `label`, or
 * the step number). Every step fits the frame on desktop; narrow screens
 * scroll the rail with snap points.
 */
function StepsRail({ steps }: { steps: MarketingStep[] }): React.ReactElement {
    return (
        <ol className={styles.rail}>
            {steps.map((step, index) => (
                <li key={step.title} className={styles.railItem} {...marketingItemStamp("steps", index)}>
                    <span className={styles.railMark}>
                        {step.icon !== undefined && isMarketingIconName(step.icon) ? (
                            <span className={styles.railIcon} aria-hidden>
                                <MarketingIcon name={step.icon} size={18} />
                            </span>
                        ) : (
                            <span className={styles.railDot} aria-hidden />
                        )}
                        {step.label !== undefined ? (
                            <span
                                className={styles.railLabel}
                                {...marketingTextStamp("label", "steps", index)}
                            >
                                {step.label}
                            </span>
                        ) : (
                            <span className={styles.railLabel}>{String(index + 1).padStart(2, "0")}</span>
                        )}
                    </span>
                    {step.media !== undefined ? (
                        <div className={styles.railMedia} {...marketingMediaStamp("steps", index)}>
                            <RailMedia media={step.media} title={step.title} />
                        </div>
                    ) : null}
                    <h3 className={styles.railTitle} {...marketingTextStamp("title", "steps", index)}>
                        {step.title}
                    </h3>
                    {step.duration !== undefined ? (
                        <p
                            className={styles.railDuration}
                            {...marketingTextStamp("duration", "steps", index)}
                        >
                            {step.duration}
                        </p>
                    ) : null}
                    <p
                        className={styles.stepDescription}
                        {...marketingTextStamp("description", "steps", index)}
                    >
                        {step.description}
                    </p>
                </li>
            ))}
        </ol>
    )
}

function TimelineImage({
    media,
    title,
    sizes,
}: {
    media: MarketingMedia
    title: string
    sizes: string
}): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${title}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.timelineImg} />
    }
    return <MarketingImage className={styles.timelineImg} {...marketingImageProps(media)} sizes={sizes} />
}

/**
 * The photographic timeline: once any step carries a photograph the rail
 * becomes a day sheet — each step's mark (its `label`, a clock time or a
 * duration, else the step number) in the margin on the line, the copy
 * beside it, and the step's lead photograph with its contact frames to
 * the right. Narrow screens drop the photographs under the copy.
 */
function StepsTimelinePhotographic({ steps }: { steps: MarketingStep[] }): React.ReactElement {
    return (
        <ol className={styles.timelinePhoto}>
            {steps.map((step, index) => {
                const frames = step.frames ?? []
                const pictured = step.media !== undefined || frames.length > 0
                return (
                    <li
                        key={step.title}
                        className={styles.timelinePhotoItem}
                        data-pictured={pictured ? "true" : undefined}
                        {...marketingItemStamp("steps", index)}
                    >
                        <span className={styles.timelineMark}>
                            <span className={styles.timelineNode} aria-hidden />
                            {step.label !== undefined ? (
                                <span
                                    className={styles.timelineLabel}
                                    {...marketingTextStamp("label", "steps", index)}
                                >
                                    {step.label}
                                </span>
                            ) : (
                                <span className={styles.timelineLabel}>
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            )}
                        </span>
                        <div className={styles.timelineCopy}>
                            <h3
                                className={styles.timelineTitle}
                                {...marketingTextStamp("title", "steps", index)}
                            >
                                {step.title}
                            </h3>
                            <p
                                className={`${styles.stepDescription} ${styles.timelineDescription}`}
                                {...marketingTextStamp("description", "steps", index)}
                            >
                                {step.description}
                            </p>
                        </div>
                        {pictured ? (
                            <div className={styles.timelineMedia}>
                                {step.media !== undefined ? (
                                    <figure
                                        className={styles.timelineLead}
                                        {...marketingMediaStamp("steps", index)}
                                    >
                                        <TimelineImage
                                            media={step.media}
                                            title={step.title}
                                            sizes="(min-width: 860px) 40vw, 90vw"
                                        />
                                    </figure>
                                ) : null}
                                {frames.map((frame, frameIndex) => (
                                    <figure
                                        key={frameIndex}
                                        className={styles.timelineFrame}
                                        {...marketingMediaStamp(`steps.${index}.frames`, frameIndex)}
                                    >
                                        <TimelineImage
                                            media={frame}
                                            title={`${step.title} ${frameIndex + 1}`}
                                            sizes="(min-width: 860px) 14vw, 30vw"
                                        />
                                    </figure>
                                ))}
                            </div>
                        ) : null}
                    </li>
                )
            })}
        </ol>
    )
}

/**
 * How-it-works section ("is it hard to start?"). `numbered-cards` is a row
 * of step cards; `timeline` runs the same steps down a vertical accent rail;
 * `horizontal-rail` lays them left to right as photo cards on a thin
 * connecting line — the build log, for trades that show the process.
 * `message-thread` tells them as the text conversation the customer
 * actually gets (MarketingMessageThread).
 */
export function MarketingSteps(props: MarketingStepsProps): React.ReactElement {
    if (props.variant === "message-thread") {
        return <MarketingMessageThread {...props} />
    }
    return <MarketingStepsList {...props} />
}

function MarketingStepsList({
    variant = "numbered-cards",
    anchorId,
    kicker,
    title,
    steps,
}: MarketingStepsProps): React.ReactElement {
    return (
        <section
            id={anchorId}
            className={variant === "horizontal-rail" ? styles.wrapRail : styles.wrap}
            aria-label={title ?? "How it works"}
        >
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? (
                <h2 className={variant === "horizontal-rail" ? styles.titleRail : styles.title}>{title}</h2>
            ) : null}
            {variant === "horizontal-rail" ? (
                <StepsRail steps={steps} />
            ) : variant === "timeline" &&
              steps.some((step) => step.media !== undefined || (step.frames ?? []).length > 0) ? (
                <StepsTimelinePhotographic steps={steps} />
            ) : variant === "timeline" ? (
                <ol className={styles.timeline}>
                    {steps.map((step, index) => (
                        <li
                            key={step.title}
                            className={styles.timelineItem}
                            {...marketingItemStamp("steps", index)}
                        >
                            <span className={styles.timelineDot} aria-hidden>
                                {index + 1}
                            </span>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className={styles.row}>
                    {steps.map((step, index) => (
                        <article
                            key={step.title}
                            className={styles.card}
                            {...marketingItemStamp("steps", index)}
                        >
                            <span className={styles.number}>{index + 1}</span>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
