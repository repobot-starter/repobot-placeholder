import React, { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
    useCheckoutSessionQuery,
    useCompleteTestCheckoutSessionMutation,
} from "../../generated/graphql/types"
import * as styles from "./Checkout.styles.css"
import { formatMoney } from "./money"
import { routes } from "../../Config/Router"

/**
 * The sandbox's stand-in for Stripe's hosted checkout page
 * (PAYMENTS_MODE=local). Clearly labeled as a test — no real payment happens;
 * the Pay button completes the session via completeTestCheckoutSession, which
 * the backend refuses outside local mode. Deployed storefronts never route
 * buyers here: their sessions carry Stripe URLs.
 */
export default function TestCheckoutPage(): React.ReactElement {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const sessionId = searchParams.get("session") ?? ""
    const sessionQuery = useCheckoutSessionQuery({
        variables: { id: sessionId },
        skip: sessionId === "",
    })
    const [completeSession, completeState] = useCompleteTestCheckoutSessionMutation()
    const [error, setError] = useState<string>()

    const session = sessionQuery.data?.checkoutSession

    const pay = async (): Promise<void> => {
        setError(undefined)
        try {
            await completeSession({ variables: { input: { sessionId } } })
            navigate(`${routes.checkoutSuccess.path}?session=${sessionId}`)
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Payment could not be completed.")
        }
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <p className={styles.testBanner}>
                    Test checkout — no real payment. Deployed shops use Stripe&apos;s secure checkout page
                    here.
                </p>
                {sessionId === "" || (sessionQuery.error !== undefined && !sessionQuery.loading) ? (
                    <>
                        <h1 className={styles.heading}>Checkout not found</h1>
                        <p className={styles.subtext}>
                            This checkout link is missing or expired. Head back to the shop to start again.
                        </p>
                        <Link className={styles.backLink} to={routes.home.path}>
                            ← Back to the shop
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className={styles.heading}>Complete your order</h1>
                        <div className={styles.summary}>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Item</span>
                                <span className={styles.summaryValue}>{session?.productName ?? "…"}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Total</span>
                                <span className={styles.summaryValue}>
                                    {session !== undefined
                                        ? formatMoney(session.amountTotal, session.currency)
                                        : "…"}
                                </span>
                            </div>
                        </div>
                        <div className={styles.mockField}>
                            <span className={styles.mockFieldLabel}>Card number</span>
                            <span className={styles.mockInput}>4242 4242 4242 4242</span>
                        </div>
                        <button
                            type="button"
                            className={styles.payButton}
                            onClick={() => void pay()}
                            disabled={completeState.loading || session === undefined}
                        >
                            {completeState.loading ? "Processing…" : "Pay (test)"}
                        </button>
                        {error !== undefined && <p className={styles.errorText}>{error}</p>}
                        <Link className={styles.backLink} to={routes.checkoutCancelled.path}>
                            Cancel and go back
                        </Link>
                    </>
                )}
            </div>
        </main>
    )
}
