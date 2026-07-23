import React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useCheckoutSessionQuery } from "../../generated/graphql/types"
import * as styles from "./Checkout.styles.css"
import { formatMoney } from "./money"
import { routes } from "../../Config/Router"
import { shopContent } from "./shopContent"

/**
 * Where buyers land after paying. Payment is verified server-side: the
 * checkoutSession query checks Stripe's payment_status before reporting PAID,
 * so a hand-typed URL can't fake a confirmation. Stripe can redirect a beat
 * before settlement, so a PENDING session gets a gentle "still confirming"
 * state with a refresh.
 */
export default function CheckoutSuccessPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get("session") ?? ""
    const sessionQuery = useCheckoutSessionQuery({
        variables: { id: sessionId },
        skip: sessionId === "",
        fetchPolicy: "network-only",
    })

    const session = sessionQuery.data?.checkoutSession
    const isMissing = sessionId === "" || (sessionQuery.error !== undefined && !sessionQuery.loading)

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                {isMissing ? (
                    <>
                        <h1 className={styles.heading}>Order not found</h1>
                        <p className={styles.subtext}>
                            We couldn&apos;t find that order. If you just paid, check your email receipt from
                            Stripe.
                        </p>
                    </>
                ) : session === undefined || sessionQuery.loading ? (
                    <>
                        <h1 className={styles.heading}>Checking your order…</h1>
                        <p className={styles.subtext}>One moment.</p>
                    </>
                ) : session.status === "PAID" ? (
                    <>
                        <div className={styles.successMark} aria-hidden="true">
                            ✓
                        </div>
                        <h1 className={styles.heading}>Thank you!</h1>
                        <p className={styles.subtext}>
                            Your copy of {session.productName} is on its way. {shopContent.authorName} will
                            sign it before it ships. A receipt has been sent to your email.
                        </p>
                        <div className={styles.summary}>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Paid</span>
                                <span className={styles.summaryValue}>
                                    {formatMoney(session.amountTotal, session.currency)}
                                </span>
                            </div>
                        </div>
                        <p className={styles.orderRef}>Order reference: {session.id}</p>
                    </>
                ) : (
                    <>
                        <h1 className={styles.heading}>Confirming your payment…</h1>
                        <p className={styles.subtext}>
                            Your payment is being confirmed. This usually takes a few seconds.
                        </p>
                        <button
                            type="button"
                            className={styles.payButton}
                            onClick={() => void sessionQuery.refetch()}
                        >
                            Check again
                        </button>
                    </>
                )}
                <Link className={styles.backLink} to={routes.home.path}>
                    ← Back to the shop
                </Link>
            </div>
        </main>
    )
}
