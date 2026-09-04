import React, { useState } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { useSnapshot } from "valtio"
import { authRouteWithReturnTo, routes } from "../../Config/Router"
import { runtime } from "../../Config/Runtime"
import { useCancelTestSubscriptionMutation, useMySubscriptionQuery } from "../../generated/graphql/types"
import * as styles from "../Shop/Checkout.styles.css"
import { formatMoney } from "../Shop/money"

/**
 * The sandbox's stand-in for Stripe's Billing Portal (PAYMENTS_MODE=local).
 * Clearly labeled as a test — it shows the caller's simulated subscription
 * and cancels it via cancelTestSubscription, which the backend refuses
 * outside local mode. Deployed apps never route users here: their
 * createBillingPortalSession URLs point at Stripe's hosted portal.
 */
export default function TestBillingPage(): React.ReactElement {
    const auth = useSnapshot(runtime.store.auth)
    const location = useLocation()
    const subscriptionQuery = useMySubscriptionQuery({
        skip: auth.status !== "signedIn",
        fetchPolicy: "network-only",
    })
    const [cancelSubscription, cancelState] = useCancelTestSubscriptionMutation()
    const [error, setError] = useState<string>()

    if (auth.status === "signedOut") {
        const returnToPath = `${location.pathname}${location.search}${location.hash}`
        return <Navigate to={authRouteWithReturnTo(routes.login.path, returnToPath)} replace />
    }

    const subscription = subscriptionQuery.data?.mySubscription

    const cancel = async (): Promise<void> => {
        setError(undefined)
        try {
            await cancelSubscription()
            await subscriptionQuery.refetch()
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Cancelling failed.")
        }
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <p className={styles.testBanner}>
                    Test billing — no real subscription. Deployed apps use Stripe&apos;s secure Billing Portal
                    here.
                </p>
                {subscription === undefined || subscription === null ? (
                    <>
                        <h1 className={styles.heading}>
                            {subscriptionQuery.loading ? "Loading…" : "No subscription"}
                        </h1>
                        {!subscriptionQuery.loading && (
                            <p className={styles.subtext}>
                                There is no subscription on this account to manage.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <h1 className={styles.heading}>Manage your subscription</h1>
                        <div className={styles.summary}>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Plan</span>
                                <span className={styles.summaryValue}>{subscription.productName}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Price</span>
                                <span className={styles.summaryValue}>
                                    {formatMoney(subscription.amountTotal, subscription.currency)} /{" "}
                                    {subscription.recurringInterval.toLowerCase()}
                                </span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Status</span>
                                <span className={styles.summaryValue}>{subscription.status}</span>
                            </div>
                        </div>
                        {subscription.status === "CANCELED" ? (
                            <p className={styles.subtext}>This subscription has been cancelled.</p>
                        ) : (
                            <button
                                type="button"
                                className={styles.payButton}
                                onClick={() => void cancel()}
                                disabled={cancelState.loading}
                            >
                                {cancelState.loading ? "Cancelling…" : "Cancel subscription (test)"}
                            </button>
                        )}
                        {error !== undefined && <p className={styles.errorText}>{error}</p>}
                    </>
                )}
                <Link className={styles.backLink} to={routes.settings.path}>
                    ← Back to settings
                </Link>
            </div>
        </main>
    )
}
