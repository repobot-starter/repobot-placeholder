import React, { useState } from "react"
import { useCreateCheckoutSessionMutation, useShopProductQuery } from "../../generated/graphql/types"
import { formatMoney } from "./money"
import { shopContent } from "./shopContent"
import * as styles from "./ShopPage.styles.css"

/**
 * The storefront for the shop pack: an author's site selling one book, with
 * anonymous checkout. The buy button asks the backend for a checkout session
 * and sends the buyer to its URL — Stripe's hosted page when deployed, the
 * in-app test checkout in the sandbox. All copy lives in shopContent.ts.
 */
export default function ShopPage(): React.ReactElement {
    const productQuery = useShopProductQuery()
    const product = productQuery.data?.shopProduct
    const priceLabel =
        product !== undefined ? formatMoney(product.priceMinorUnits, product.currency) : undefined

    return (
        <main className={styles.page}>
            <header className={styles.topbar}>
                <a className={styles.wordmark} href="#top">
                    {shopContent.authorName}
                </a>
                <nav className={styles.topbarNav}>
                    <a className={styles.topbarLink} href="#reviews">
                        Reviews
                    </a>
                    <a className={styles.topbarLink} href="#about">
                        About
                    </a>
                    <a className={styles.topbarLink} href="#buy">
                        Buy the book
                    </a>
                </nav>
            </header>

            <section className={styles.hero} id="top">
                <div>
                    <p className={styles.eyebrow}>{shopContent.eyebrow}</p>
                    <h1 className={styles.title}>{shopContent.bookTitle}</h1>
                    <p className={styles.byline}>a novel by {shopContent.authorName}</p>
                    <p className={styles.lede}>{shopContent.lede}</p>
                    <BuyControls priceLabel={priceLabel} />
                    <p className={styles.editionNote}>{shopContent.editionNote}</p>
                </div>
                <div className={styles.coverWrap}>
                    <div
                        className={styles.cover}
                        role="img"
                        aria-label={`${shopContent.bookTitle} book cover`}
                    >
                        <p className={styles.coverEyebrow}>A novel</p>
                        <h2 className={styles.coverTitle}>
                            {shopContent.bookTitle}
                            <span className={styles.coverRule} aria-hidden="true" />
                        </h2>
                        <p className={styles.coverAuthor}>{shopContent.authorName}</p>
                    </div>
                </div>
            </section>

            <section className={styles.excerptSection}>
                <blockquote className={styles.excerpt}>
                    “{shopContent.excerpt}”
                    <span className={styles.excerptAttribution}>{shopContent.excerptAttribution}</span>
                </blockquote>
            </section>

            <section className={styles.section} id="reviews">
                <h2 className={styles.sectionHeading}>What readers are saying</h2>
                <div className={styles.reviewGrid}>
                    {shopContent.reviews.map((review) => (
                        <figure key={review.source} className={styles.reviewCard}>
                            <blockquote className={styles.reviewQuote}>“{review.quote}”</blockquote>
                            <figcaption className={styles.reviewSource}>{review.source}</figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            <section className={styles.aboutSection} id="about">
                <div className={styles.portrait} aria-hidden="true">
                    {initials(shopContent.authorName)}
                </div>
                <div className={styles.aboutBody}>
                    <h2 className={styles.sectionHeading}>{shopContent.about.heading}</h2>
                    {shopContent.about.paragraphs.map((paragraph) => (
                        <p key={paragraph.slice(0, 24)} className={styles.aboutParagraph}>
                            {paragraph}
                        </p>
                    ))}
                </div>
            </section>

            <section className={styles.buyBand} id="buy">
                <div className={styles.buyBandInner}>
                    <h2 className={styles.buyBandHeading}>
                        Take {shopContent.bookTitle} home{priceLabel !== undefined ? ` — ${priceLabel}` : ""}
                    </h2>
                    <BuyControls priceLabel={undefined} buttonClassName={styles.buyBandButton} />
                </div>
            </section>

            <footer className={styles.footer}>
                <span>
                    © {new Date().getFullYear()} {shopContent.authorName}
                </span>
                <span>{shopContent.footerNote}</span>
            </footer>
        </main>
    )
}

function BuyControls(props: {
    priceLabel: string | undefined
    buttonClassName?: string
}): React.ReactElement {
    const [createCheckoutSession, createState] = useCreateCheckoutSessionMutation()
    const [error, setError] = useState<string>()

    const startCheckout = async (): Promise<void> => {
        setError(undefined)
        try {
            const result = await createCheckoutSession({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: { origin: window.location.origin },
                    },
                },
            })
            const checkoutUrl = result.data?.createCheckoutSession.checkoutUrl
            if (checkoutUrl === undefined) {
                setError("Checkout could not be started. Please try again.")
                return
            }
            window.location.assign(checkoutUrl)
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Checkout could not be started.")
        }
    }

    return (
        <div>
            <div className={styles.buyRow}>
                <button
                    type="button"
                    className={props.buttonClassName ?? styles.buyButton}
                    onClick={() => void startCheckout()}
                    disabled={createState.loading}
                >
                    {createState.loading ? "Opening checkout…" : "Buy the book"}
                </button>
                {props.priceLabel !== undefined && <span className={styles.price}>{props.priceLabel}</span>}
            </div>
            {error !== undefined && <p className={styles.buyError}>{error}</p>}
        </div>
    )
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
}
