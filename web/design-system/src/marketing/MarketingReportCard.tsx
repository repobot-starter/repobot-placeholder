import React from "react"
import type { MarketingMedia } from "./marketingContent"
import type { MarketingReport } from "./MarketingContentSplit"
import { marketingItemStamp, marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingReportCard.styles.css"

function ReportPhoto({
    media,
    label,
    field,
}: {
    media: MarketingMedia
    label: string
    field: "before" | "after"
}): React.ReactElement {
    return (
        <figure className={styles.photo} {...marketingMediaStamp(`report.${field}`, 0)}>
            {media.kind === "image" || media.kind === "browser" ? (
                <MarketingImage
                    className={styles.photoImg}
                    {...marketingImageProps(media)}
                    sizes="(min-width: 900px) 280px, 45vw"
                />
            ) : (
                <MarketingArtPanel
                    seed={media.kind === "glyph" ? media.seed : `${label}${media.emoji}`}
                    className={styles.photoImg}
                />
            )}
            <figcaption className={styles.photoTag}>{label}</figcaption>
        </figure>
    )
}

/**
 * The content-split `report` card: one finished job as a case file. Label
 * and issuer over the title and location; labeled rows (a `highlight` row
 * sets its value at display size in the accent); an optional rubber stamp
 * askew over the rows; the before/after pair; the signature line.
 */
export function MarketingReportCard({ report }: { report: MarketingReport }): React.ReactElement {
    const { label, issuer, title, location, rows, before, after, signature, stamp } = report
    return (
        <article className={styles.card} aria-label={title}>
            {label !== undefined || issuer !== undefined ? (
                <div className={styles.masthead}>
                    {label !== undefined ? (
                        <span className={styles.label} {...marketingTextStamp("report.label")}>
                            {label}
                        </span>
                    ) : null}
                    {issuer !== undefined ? (
                        <span className={styles.issuer} {...marketingTextStamp("report.issuer")}>
                            {issuer}
                        </span>
                    ) : null}
                </div>
            ) : null}
            <h3 className={styles.title} {...marketingTextStamp("report.title")}>
                {title}
            </h3>
            {location !== undefined ? (
                <p className={styles.location} {...marketingTextStamp("report.location")}>
                    {location}
                </p>
            ) : null}
            <div className={styles.rowsWrap}>
                <dl className={styles.rows}>
                    {rows.map((row, index) => (
                        <div
                            key={row.label}
                            className={styles.row}
                            {...marketingItemStamp("report.rows", index)}
                        >
                            <dt
                                className={styles.rowLabel}
                                {...marketingTextStamp("label", "report.rows", index)}
                            >
                                {row.label}
                            </dt>
                            <dd
                                className={
                                    row.highlight === true
                                        ? `${styles.rowValue} ${styles.rowValueHighlight}`
                                        : styles.rowValue
                                }
                                {...marketingTextStamp("value", "report.rows", index)}
                            >
                                {row.value}
                            </dd>
                        </div>
                    ))}
                </dl>
                {stamp !== undefined ? (
                    <span className={styles.stamp} {...marketingTextStamp("report.stamp")}>
                        {stamp}
                    </span>
                ) : null}
            </div>
            {before !== undefined || after !== undefined ? (
                <div className={styles.photos}>
                    {before !== undefined ? (
                        <ReportPhoto media={before} label={report.beforeLabel ?? "Before"} field="before" />
                    ) : null}
                    {after !== undefined ? (
                        <ReportPhoto media={after} label={report.afterLabel ?? "After"} field="after" />
                    ) : null}
                </div>
            ) : null}
            {signature !== undefined ? (
                <div className={styles.signature}>
                    <span className={styles.signatureName} {...marketingTextStamp("report.signature.name")}>
                        {signature.name}
                    </span>
                    {signature.detail !== undefined ? (
                        <span
                            className={styles.signatureDetail}
                            {...marketingTextStamp("report.signature.detail")}
                        >
                            {signature.detail}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </article>
    )
}
