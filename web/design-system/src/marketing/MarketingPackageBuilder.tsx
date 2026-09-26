import React, { useState } from "react"
import { marketingHref } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import { tiersAsGroup } from "./MarketingPriceList"
import type { MarketingPriceListGroup, MarketingPricingProps } from "./MarketingPricing"
import * as styles from "./MarketingPackageBuilder.styles.css"

/** The printed number in a price ("$1,250" → 1250); null when there is none to add. */
export function packagePriceValue(price: string): number | null {
    const match = /\d[\d,]*(?:\.\d+)?/.exec(price)
    if (match === null) return null
    const value = Number(match[0].replace(/,/g, ""))
    return Number.isFinite(value) ? value : null
}

/**
 * The total, printed in the lines' own currency: the symbol leading the
 * first priced line ("$", "£", "€"), grouped en-US, cents only when a
 * line carries them.
 */
export function formatPackageTotal(total: number, prices: string[]): string {
    const sample = prices.find((price) => packagePriceValue(price) !== null) ?? "$"
    const symbol = /^[^\d\s]*/.exec(sample.trim())?.[0] ?? ""
    const cents = prices.some((price) => /\.\d/.test(price))
    return `${symbol}${total.toLocaleString("en-US", {
        minimumFractionDigits: cents ? 2 : 0,
        maximumFractionDigits: cents ? 2 : 0,
    })}`
}

const keyOf = (groupIndex: number, itemIndex: number) => `${groupIndex}:${itemIndex}`

/**
 * The lines ticked on first paint. With no `selected` line anywhere every
 * line starts ticked (the whole package shows); once any line says
 * `selected`, only those do. A pick-one group always holds exactly one —
 * its selected line, else its first.
 */
export function initialTicks(groups: MarketingPriceListGroup[]): Set<string> {
    const declared = groups.some((group) => group.items.some((item) => item.selected === true))
    const ticked = new Set<string>()
    groups.forEach((group, groupIndex) => {
        if (group.choose === "one") {
            const chosen = group.items.findIndex((item) => item.selected === true)
            if (group.items.length > 0) ticked.add(keyOf(groupIndex, chosen >= 0 ? chosen : 0))
            return
        }
        group.items.forEach((item, itemIndex) => {
            if (!declared || item.selected === true) ticked.add(keyOf(groupIndex, itemIndex))
        })
    })
    return ticked
}

/**
 * The `builder` pricing variant: a package the visitor assembles — every
 * line a ticked row (the name beside its checkbox, what's included in the
 * middle, the printed price flush right) over a running total that adds
 * the ticked lines as they change. Built for multi-event and multi-part
 * offers priced by the part: the wedding weekend (mehndi, sangeet,
 * wedding, reception), the photography day, the renovation's rooms. Every
 * line starts ticked, so the first paint shows the whole package, unless
 * lines declare `selected`; a group with `choose: "one"` is a pick-one
 * choice (radio). Lines whose price carries no number ("By quote") tick
 * but add nothing. The footnote and the optional CTA close the board like
 * the menu board's.
 *
 * `builderLayout: "tiles"` sets the same lines as photograph tiles — each
 * group a row of cards (the line's `media`, its name and price, a check
 * in the corner) — beside a summary card (`summaryTitle`) that lists the
 * ticked lines over the total, the CTA, and the footnote: the session
 * builder of a newborn or portrait studio.
 */
export function MarketingPackageBuilder(props: MarketingPricingProps): React.ReactElement {
    const { anchorId, kicker, title, intro, footnote, cta, totalLabel = "Running total" } = props
    const groups = props.groups !== undefined && props.groups.length > 0 ? props.groups : tiersAsGroup(props)
    const stampsLines = props.groups !== undefined && props.groups.length > 0
    const line = (groupIndex: number, itemIndex: number, field: string): Record<string, string | number> =>
        stampsLines ? marketingTextStamp(`items.${itemIndex}.${field}`, "groups", groupIndex) : {}
    const [ticked, setTicked] = useState<ReadonlySet<string>>(() => initialTicks(groups))
    const toggle = (groupIndex: number, itemIndex: number) =>
        setTicked((current) => {
            const next = new Set(current)
            const key = keyOf(groupIndex, itemIndex)
            if (groups[groupIndex]?.choose === "one") {
                groups[groupIndex].items.forEach((_, index) => next.delete(keyOf(groupIndex, index)))
                next.add(key)
            } else if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    const prices = groups.flatMap((group) => group.items.map((item) => item.price))
    const total = groups.reduce(
        (sum, group, groupIndex) =>
            sum +
            group.items.reduce(
                (groupSum, item, itemIndex) =>
                    ticked.has(keyOf(groupIndex, itemIndex))
                        ? groupSum + (packagePriceValue(item.price) ?? 0)
                        : groupSum,
                0,
            ),
        0,
    )
    const headingId = anchorId !== undefined ? `${anchorId}-total` : undefined
    const inputFor = (groupIndex: number, itemIndex: number, className: string) => {
        const group = groups[groupIndex]
        return (
            <input
                type={group?.choose === "one" ? "radio" : "checkbox"}
                name={group?.choose === "one" ? `${anchorId ?? "builder"}-group-${groupIndex}` : undefined}
                className={className}
                checked={ticked.has(keyOf(groupIndex, itemIndex))}
                onChange={() => toggle(groupIndex, itemIndex)}
                aria-describedby={headingId}
            />
        )
    }
    const head =
        kicker !== undefined || title !== undefined || intro !== undefined ? (
            <header className={styles.head}>
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
            </header>
        ) : null
    const totalBand = (className: string) => (
        <div className={className} id={headingId} role="status" aria-live="polite">
            <span
                className={styles.totalLabel}
                {...(props.totalLabel !== undefined ? marketingTextStamp("totalLabel") : {})}
            >
                {totalLabel}
            </span>
            <span className={styles.totalValue}>{formatPackageTotal(total, prices)}</span>
        </div>
    )
    const ctaLink =
        cta !== undefined ? (
            <a className={styles.cta} href={marketingHref(cta)} {...marketingTextStamp("cta.label")}>
                {cta.label}
            </a>
        ) : null
    const footnoteLine =
        footnote !== undefined ? (
            <p className={styles.footnote} {...marketingTextStamp("footnote")}>
                {footnote}
            </p>
        ) : null

    if (props.builderLayout === "tiles") {
        const picked = groups.flatMap((group, groupIndex) =>
            group.items
                .map((item, itemIndex) => ({ item, key: keyOf(groupIndex, itemIndex) }))
                .filter(({ key }) => ticked.has(key)),
        )
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Build your package"}>
                {head}
                <div className={styles.tilesLayout}>
                    <div className={styles.tileGroups}>
                        {groups.map((group, groupIndex) => (
                            <fieldset
                                key={group.heading ?? groupIndex}
                                className={styles.tileGroup}
                                {...marketingItemStamp("groups", groupIndex)}
                            >
                                {group.heading !== undefined ? (
                                    <legend
                                        className={styles.tileGroupHeading}
                                        {...(stampsLines
                                            ? marketingTextStamp("heading", "groups", groupIndex)
                                            : {})}
                                    >
                                        {group.heading}
                                    </legend>
                                ) : null}
                                <ul className={styles.tiles}>
                                    {group.items.map((item, itemIndex) => (
                                        <li
                                            key={item.name}
                                            className={styles.tile}
                                            data-ticked={ticked.has(keyOf(groupIndex, itemIndex))}
                                        >
                                            <label className={styles.tilePick}>
                                                {inputFor(groupIndex, itemIndex, styles.check)}
                                                <span className={styles.tileMedia}>
                                                    {item.media !== undefined &&
                                                    item.media.kind === "image" ? (
                                                        <MarketingImage
                                                            className={styles.tileImg}
                                                            {...marketingImageProps(item.media)}
                                                            sizes="(min-width: 980px) 16vw, 45vw"
                                                        />
                                                    ) : null}
                                                    <span className={styles.tileBox} aria-hidden />
                                                </span>
                                                <span
                                                    className={styles.tileName}
                                                    {...line(groupIndex, itemIndex, "name")}
                                                >
                                                    {item.name}
                                                </span>
                                                {item.note !== undefined ? (
                                                    <span
                                                        className={styles.tileNote}
                                                        {...line(groupIndex, itemIndex, "note")}
                                                    >
                                                        {item.note}
                                                    </span>
                                                ) : null}
                                                <span className={styles.tilePrice}>
                                                    {item.qualifier !== undefined ? (
                                                        <span {...line(groupIndex, itemIndex, "qualifier")}>
                                                            {item.qualifier}{" "}
                                                        </span>
                                                    ) : null}
                                                    <span {...line(groupIndex, itemIndex, "price")}>
                                                        {item.price}
                                                    </span>
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </fieldset>
                        ))}
                    </div>
                    <aside className={styles.summary} aria-label={props.summaryTitle ?? totalLabel}>
                        {props.summaryTitle !== undefined ? (
                            <h3 className={styles.summaryTitle} {...marketingTextStamp("summaryTitle")}>
                                {props.summaryTitle}
                            </h3>
                        ) : null}
                        <ul className={styles.summaryLines}>
                            {picked
                                .filter(({ item }) => packagePriceValue(item.price) !== null)
                                .map(({ item, key }) => (
                                    <li key={key} className={styles.summaryLine}>
                                        <span>{item.name}</span>
                                        <span className={styles.summaryPrice}>{item.price}</span>
                                    </li>
                                ))}
                        </ul>
                        {totalBand(styles.summaryTotal)}
                        {ctaLink !== null ? <div className={styles.summaryCta}>{ctaLink}</div> : null}
                        {footnoteLine}
                    </aside>
                </div>
            </section>
        )
    }

    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Build your package"}>
            <div className={styles.board}>
                {head}
                {groups.map((group, groupIndex) => (
                    <fieldset
                        key={group.heading ?? groupIndex}
                        className={styles.group}
                        {...marketingItemStamp("groups", groupIndex)}
                    >
                        {group.heading !== undefined ? (
                            <legend
                                className={styles.groupHeading}
                                {...(stampsLines ? marketingTextStamp("heading", "groups", groupIndex) : {})}
                            >
                                {group.heading}
                            </legend>
                        ) : null}
                        <ul className={styles.lines}>
                            {group.items.map((item, itemIndex) => (
                                <li
                                    key={item.name}
                                    className={styles.line}
                                    data-ticked={ticked.has(keyOf(groupIndex, itemIndex))}
                                >
                                    <label className={styles.pick}>
                                        {inputFor(groupIndex, itemIndex, styles.check)}
                                        <span className={styles.box} aria-hidden />
                                        <span
                                            className={styles.name}
                                            {...line(groupIndex, itemIndex, "name")}
                                        >
                                            {item.name}
                                        </span>
                                    </label>
                                    <span className={styles.note}>
                                        {item.note !== undefined ? (
                                            <span {...line(groupIndex, itemIndex, "note")}>{item.note}</span>
                                        ) : null}
                                    </span>
                                    <span className={styles.price}>
                                        {item.qualifier !== undefined ? (
                                            <span className={styles.qualifier}>
                                                <span {...line(groupIndex, itemIndex, "qualifier")}>
                                                    {item.qualifier}
                                                </span>{" "}
                                            </span>
                                        ) : null}
                                        <span {...line(groupIndex, itemIndex, "price")}>{item.price}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </fieldset>
                ))}
                {totalBand(styles.total)}
                {footnote !== undefined || cta !== undefined ? (
                    <footer className={styles.foot}>
                        {footnoteLine}
                        {ctaLink}
                    </footer>
                ) : null}
            </div>
        </section>
    )
}
