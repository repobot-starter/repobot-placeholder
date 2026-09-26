import React from "react"
import type { MarketingMedia } from "./marketingContent"
import { marketingItemStamp, marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import * as styles from "./MarketingThreadCard.styles.css"

/** One text message in a thread card. */
export interface MarketingThreadMessage {
    text: string
    /** `start` (left, a surface bubble, the default) or `end` (right, in the
     * accent — the conventional "sent" side, usually the business's voice). */
    side?: "start" | "end"
    /** The time label under the message, e.g. "10:28 AM". */
    time?: string
    /** A photo attached under the message's text. */
    media?: MarketingMedia
    /** A confirmation chip, e.g. "Approved". */
    chip?: string
}

export interface MarketingThreadCardProps {
    /** The conversation header: who the thread is with. */
    name?: string
    detail?: string
    messages: MarketingThreadMessage[]
    /** Tighter bubbles and a shorter photo — the hero-aside size. */
    compact?: boolean
    className?: string
    /**
     * Preview-editor stamps: the section content list the messages come
     * from and the item field holding each message's text. Omitted when the
     * messages don't map to a top-level content list.
     */
    stampList?: string
    stampTextField?: string
    /**
     * Stamps for a thread nested in a section field rather than a list (the
     * hero's `aside`): every string is a scalar path under it
     * (`aside.messages.2.text`), attachments are the `aside.messages` media
     * list, and nothing is an item — nested messages don't reorder.
     */
    stampPath?: string
    /** Where the header's `name`/`detail` live when the messages are a
     * list (the steps variant's `thread`). */
    stampHeadPath?: string
}

function Attachment({
    media,
    index,
    compact,
    stampList,
}: {
    media: MarketingMedia
    index: number
    compact: boolean
    stampList?: string
}): React.ReactElement | null {
    // A glyph or emoji "photo" in a text thread reads as filler; only real
    // images attach.
    if (media.kind !== "image" && media.kind !== "browser") return null
    return (
        <span
            className={styles.attachment}
            {...(stampList !== undefined ? marketingMediaStamp(stampList, index) : {})}
        >
            <MarketingImage
                className={
                    compact ? `${styles.attachmentImg} ${styles.attachmentImgCompact}` : styles.attachmentImg
                }
                {...marketingImageProps(media)}
                sizes="(min-width: 900px) 320px, 70vw"
            />
        </span>
    )
}

/**
 * A text conversation framed like a phone: an ink header (avatar initial,
 * name, detail) over chat bubbles with optional time labels, photo
 * attachments, and confirmation chips. Shared by the `steps`
 * `message-thread` variant and the hero's thread aside.
 */
export function MarketingThreadCard({
    name,
    detail,
    messages,
    compact = false,
    className,
    stampList,
    stampTextField,
    stampPath,
    stampHeadPath,
}: MarketingThreadCardProps): React.ReactElement {
    const text = (field: string, index?: number): Record<string, string | number> => {
        if (index === undefined) {
            const head = stampPath ?? stampHeadPath
            return head !== undefined ? marketingTextStamp(`${head}.${field}`) : {}
        }
        if (stampPath !== undefined) return marketingTextStamp(`${stampPath}.messages.${index}.${field}`)
        if (stampList === undefined) return {}
        return marketingTextStamp(field, stampList, index)
    }
    const mediaList = stampPath !== undefined ? `${stampPath}.messages` : stampList
    const frame = [styles.phone, compact ? styles.phoneCompact : undefined, className]
        .filter(Boolean)
        .join(" ")
    return (
        <div className={frame}>
            {name !== undefined ? (
                <div
                    className={compact ? `${styles.phoneHead} ${styles.phoneHeadCompact}` : styles.phoneHead}
                >
                    <span className={styles.avatar} aria-hidden>
                        {name.trim().charAt(0)}
                    </span>
                    <span className={styles.phoneWho}>
                        <span className={styles.phoneName} {...text("name")}>
                            {name}
                        </span>
                        {detail !== undefined ? (
                            <span className={styles.phoneDetail} {...text("detail")}>
                                {detail}
                            </span>
                        ) : null}
                    </span>
                </div>
            ) : null}
            <ol
                className={compact ? `${styles.messages} ${styles.messagesCompact}` : styles.messages}
                aria-label="Text messages"
            >
                {messages.map((message, index) => {
                    const outgoing = message.side === "end"
                    return (
                        <li
                            key={`${index}-${message.text}`}
                            className={outgoing ? `${styles.message} ${styles.messageEnd}` : styles.message}
                            {...(stampList !== undefined ? marketingItemStamp(stampList, index) : {})}
                        >
                            <span
                                className={[
                                    styles.bubble,
                                    outgoing ? styles.bubbleEnd : undefined,
                                    compact ? styles.bubbleCompact : undefined,
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                <span
                                    className={
                                        compact
                                            ? `${styles.bubbleText} ${styles.bubbleTextCompact}`
                                            : styles.bubbleText
                                    }
                                    {...(stampPath !== undefined
                                        ? text("text", index)
                                        : stampTextField !== undefined
                                          ? text(stampTextField, index)
                                          : {})}
                                >
                                    {message.text}
                                </span>
                                {message.media !== undefined ? (
                                    <Attachment
                                        media={message.media}
                                        index={index}
                                        compact={compact}
                                        stampList={mediaList}
                                    />
                                ) : null}
                                {message.chip !== undefined || message.time !== undefined ? (
                                    <span className={styles.meta}>
                                        {message.chip !== undefined ? (
                                            <span className={styles.chip}>✓ {message.chip}</span>
                                        ) : null}
                                        {message.time !== undefined ? (
                                            <span className={styles.time} {...text("time", index)}>
                                                {message.time}
                                            </span>
                                        ) : null}
                                    </span>
                                ) : null}
                            </span>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
