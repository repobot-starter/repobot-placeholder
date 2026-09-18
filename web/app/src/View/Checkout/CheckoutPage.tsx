import { AppShell } from "@ui"
import React, { useState } from "react"
import { useCreateCheckoutSessionMutation, useShopProductsQuery } from "../../generated/graphql/types"
import { checkoutContent } from "./checkoutContent"
import * as styles from "./CheckoutPage.styles.css"

/** The dining room has no navigation to offer the shell — it is one page. */
const NO_NAV_SECTIONS: never[] = []

/**
 * The checkout pack's home surface: one class, one reserve button, a real
 * checkout. The button asks the payments kernel for a checkout session and
 * sends the buyer to its URL — Stripe's hosted page when deployed, the
 * in-app test checkout in the sandbox (PAYMENTS_MODE=local). What checkout
 * charges is server-side (ShopCatalog's `session` product); all display
 * copy lives in checkoutContent.ts. The chrome is the kernel AppShell in
 * its minimal treatment (a one-page seller wants no nav rail — the old
 * topbar's wordmark rides the shell brand slot, its tag the footer), so
 * shell.variant, mode, and palette rolls now reach the supper club too.
 * See packs/checkout/PACK.md.
 */
export default function CheckoutPage(): React.ReactElement {
    const productsQuery = useShopProductsQuery()
    const product = productsQuery.data?.shopProducts.find(
        (candidate) => candidate.key === checkoutContent.productKey,
    )
    const priceLabel = product !== undefined ? formatMoney(product.priceMinorUnits, product.currency) : "…"

    return (
        <AppShell
            title={checkoutContent.brandName}
            brandIcon={<FlameGlyph />}
            sections={NO_NAV_SECTIONS}
            onItemSelect={() => undefined}
        >
            <main className={styles.page}>
                <section className={styles.hero}>
                    <div className={styles.story}>
                        <p className={styles.eyebrow}>
                            <span className={styles.eyebrowRule} aria-hidden="true" />
                            {checkoutContent.eyebrow}
                            <span className={styles.eyebrowRule} aria-hidden="true" />
                        </p>
                        <h1 className={styles.headline}>{checkoutContent.className}</h1>
                        <p className={styles.dateline}>
                            {checkoutContent.dateLine}
                            <span className={styles.datelineDot} aria-hidden="true" />
                            {checkoutContent.timeLine}
                            <span className={styles.datelineDot} aria-hidden="true" />
                            {checkoutContent.placeLine}
                        </p>
                        <p className={styles.lede}>{checkoutContent.lede}</p>

                        <div className={styles.host}>
                            <span className={styles.hostMedallion} aria-hidden="true">
                                {checkoutContent.host.initials}
                            </span>
                            <p className={styles.hostText}>
                                <strong className={styles.hostName}>{checkoutContent.host.name}</strong>
                                {checkoutContent.host.bio}
                            </p>
                        </div>

                        <div className={styles.menuSetting}>
                            <ForkGlyph />
                            <aside className={styles.menuCard} aria-label={checkoutContent.menuTitle}>
                                <p className={styles.menuTitle}>{checkoutContent.menuTitle}</p>
                                <MenuDivider />
                                <ul className={styles.menuList}>
                                    {checkoutContent.menu.map((entry) => (
                                        <li key={entry.dish} className={styles.menuItem}>
                                            <span className={styles.menuCourse}>{entry.course}</span>
                                            <span className={styles.menuDish}>{entry.dish}</span>
                                            <span className={styles.menuNote}>{entry.note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </aside>
                            <SpoonGlyph />
                        </div>
                    </div>

                    <div className={styles.reserveCard}>
                        <p className={styles.reserveLabel}>{checkoutContent.reserveLabel}</p>
                        <div className={styles.price}>
                            <span className={styles.priceAmount}>{priceLabel}</span>
                            <span className={styles.priceUnit}>{checkoutContent.priceUnit}</span>
                        </div>

                        <div className={styles.seats}>
                            <span className={styles.seatDots} aria-hidden="true">
                                {Array.from({ length: checkoutContent.seatsTotal }, (_, index) => (
                                    <span
                                        key={index}
                                        className={
                                            index < checkoutContent.seatsTotal - checkoutContent.seatsLeft
                                                ? styles.seatTaken
                                                : styles.seatOpen
                                        }
                                    />
                                ))}
                            </span>
                            <span className={styles.seatsText}>
                                Only {checkoutContent.seatsLeft} of {checkoutContent.seatsTotal}{" "}
                                {checkoutContent.seatsNote}
                            </span>
                        </div>

                        <div className={styles.includes}>
                            <p className={styles.includesTitle}>{checkoutContent.includesTitle}</p>
                            <ul className={styles.includesList}>
                                {checkoutContent.includes.map((item) => (
                                    <li key={item} className={styles.includesItem}>
                                        <span className={styles.includesMark} aria-hidden="true">
                                            ✦
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <BuyButton productKey={product?.key} priceLabel={priceLabel} />
                        <p className={styles.trustLine}>
                            <LockGlyph />
                            {checkoutContent.trustLine}
                        </p>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <span>
                        © {new Date().getFullYear()} {checkoutContent.brandName}
                    </span>
                    <span>
                        {checkoutContent.brandTag} · {checkoutContent.footerNote}
                    </span>
                </footer>
            </main>
        </AppShell>
    )
}

function BuyButton(props: {
    /** The catalog product to buy; undefined while the catalog loads. */
    productKey: string | undefined
    priceLabel: string
}): React.ReactElement {
    const [createCheckoutSession, createState] = useCreateCheckoutSessionMutation()
    const [error, setError] = useState<string>()

    const startCheckout = async (): Promise<void> => {
        if (props.productKey === undefined) {
            return
        }
        setError(undefined)
        try {
            const result = await createCheckoutSession({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: {
                            // Base-qualified so the checkout return lands inside
                            // this build's mount path (demo previews live under a
                            // subpath); plain origin everywhere else.
                            origin: window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ""),
                            productKey: props.productKey,
                        },
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
        <>
            <button
                type="button"
                className={styles.buyButton}
                onClick={() => void startCheckout()}
                disabled={createState.loading || props.productKey === undefined}
            >
                {createState.loading ? "Opening checkout…" : `Reserve your seat · ${props.priceLabel}`}
            </button>
            {error !== undefined && <p className={styles.buyError}>{error}</p>}
        </>
    )
}

function formatMoney(minorUnits: number, currency: string): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    }).format(minorUnits / 100)
}

/** The old wordmark's candle flame, worn as the shell brand mark. */
function FlameGlyph(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 20" width="15" height="18" aria-hidden="true">
            <path
                d="M8 1.5C9.8 4.4 12.5 6.8 12.5 10.6C12.5 13.9 10.5 16.5 8 16.5C5.5 16.5 3.5 13.9 3.5 10.6C3.5 8.9 4.1 7.6 4.9 6.4C5.3 8 6 8.9 6.8 9.3C6.4 6.3 7 3.6 8 1.5Z"
                fill="currentColor"
            />
        </svg>
    )
}

/** Hand-drawn-feel divider for the menu card: a wavering line with a diamond. */
function MenuDivider(): React.ReactElement {
    return (
        <svg className={styles.menuDivider} viewBox="0 0 220 12" aria-hidden="true">
            <path
                d="M4 6 C 30 3.5, 55 8.5, 92 6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
            />
            <path d="M110 1.5 L 114.5 6 L 110 10.5 L 105.5 6 Z" fill="currentColor" />
            <path
                d="M128 6 C 165 8.5, 190 3.5, 216 6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    )
}

/** Line-art fork laid beside the menu, like a set place. */
function ForkGlyph(): React.ReactElement {
    return (
        <svg className={styles.utensil} viewBox="0 0 28 130" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
                <path d="M6 8 v20 c0 6 3.5 9.5 8 9.5 s8 -3.5 8 -9.5 v-20" />
                <path d="M11.3 8 v18" />
                <path d="M16.7 8 v18" />
                <path d="M14 38 v84" strokeWidth="2.6" />
            </g>
        </svg>
    )
}

/** Line-art spoon for the other side of the place setting. */
function SpoonGlyph(): React.ReactElement {
    return (
        <svg className={styles.utensil} viewBox="0 0 28 130" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
                <ellipse cx="14" cy="21" rx="8" ry="14" />
                <path d="M14 36 v86" strokeWidth="2.6" />
            </g>
        </svg>
    )
}

/** Padlock for the trust line. */
function LockGlyph(): React.ReactElement {
    return (
        <svg className={styles.trustGlyph} viewBox="0 0 12 14" aria-hidden="true">
            <rect x="1.5" y="6" width="9" height="6.5" rx="1.4" fill="currentColor" />
            <path
                d="M3.5 6V4.2C3.5 2.8 4.6 1.6 6 1.6C7.4 1.6 8.5 2.8 8.5 4.2V6"
                stroke="currentColor"
                strokeWidth="1.4"
                fill="none"
            />
        </svg>
    )
}
