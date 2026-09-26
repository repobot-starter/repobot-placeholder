import React from "react"
import { marketingTextStamp } from "./marketingItemStamp"
import type { MarketingStepsProps } from "./MarketingSteps"
import { MarketingThreadCard } from "./MarketingThreadCard"
import * as styles from "./MarketingMessageThread.styles.css"

/**
 * The `message-thread` steps variant: how it works, told as the text
 * conversation the customer actually receives. Each step's `title` is a
 * chat bubble — `side` picks the sender (`start`, default: a surface bubble
 * on the left; `end`: an accent bubble on the right, the conventional
 * "sent" side — usually the business's own voice), with an optional `time` label,
 * photo attachment (`media`), and confirmation `chip` — inside a phone-card
 * frame headed by `thread`. The step `description`s run beside the phone
 * as the numbered plain-language walkthrough (after the phone on phones),
 * so the thread shows the promise and the list explains it.
 */
export function MarketingMessageThread({
    anchorId,
    kicker,
    title,
    intro,
    thread,
    steps,
}: MarketingStepsProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "How it works"}>
            <div className={styles.copy}>
                {kicker !== undefined ? (
                    <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                        {kicker}
                    </span>
                ) : null}
                {title !== undefined ? (
                    <h2 className={styles.title} {...marketingTextStamp("title")}>
                        {title}
                    </h2>
                ) : null}
                {intro !== undefined ? (
                    <p className={styles.intro} {...marketingTextStamp("intro")}>
                        {intro}
                    </p>
                ) : null}
            </div>
            <ol className={styles.walkthrough}>
                {steps.map((step, index) => (
                    <li key={step.title} className={styles.walkthroughItem}>
                        <span className={styles.walkthroughNumber} aria-hidden>
                            {index + 1}
                        </span>
                        <span {...marketingTextStamp("description", "steps", index)}>{step.description}</span>
                    </li>
                ))}
            </ol>
            <MarketingThreadCard
                className={styles.phoneSlot}
                name={thread?.name}
                detail={thread?.detail}
                messages={steps.map((step) => ({
                    text: step.title,
                    side: step.side,
                    time: step.time,
                    media: step.media,
                    chip: step.chip,
                }))}
                stampList="steps"
                stampTextField="title"
                stampHeadPath="thread"
            />
        </section>
    )
}
