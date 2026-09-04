import { Spinner } from "@ui"
import React, { useEffect, useRef, useState } from "react"
import { Link, Navigate, useSearchParams } from "react-router-dom"
import { useSnapshot } from "valtio"
import { routes } from "../../Config/Router"
import { runtime } from "../../Config/Runtime"
import { useCreateSubscriptionCheckoutSessionMutation } from "../../generated/graphql/types"
import * as styles from "../Shop/Checkout.styles.css"

/**
 * The pricing page's CTA target: starts a subscription checkout for the
 * signed-in user and hands them to the session's checkoutUrl (Stripe's
 * hosted page when deployed, the in-app test checkout in the sandbox).
 * Subscription checkout is never anonymous — signed-out visitors are sent
 * to sign-up first and land back here via the normal post-auth flow.
 * `?plan=<key>` picks a catalog plan; omitted means the default plan.
 */
export default function SubscribePage(): React.ReactElement {
    const auth = useSnapshot(runtime.store.auth)
    const [searchParams] = useSearchParams()
    const productKey = searchParams.get("plan")
    const [createSession] = useCreateSubscriptionCheckoutSessionMutation()
    const [error, setError] = useState<string>()
    const startedRef = useRef(false)

    useEffect(() => {
        if (auth.status !== "signedIn" || startedRef.current) {
            return
        }
        startedRef.current = true
        void (async () => {
            try {
                const result = await createSession({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            fields: { origin: window.location.origin, productKey },
                        },
                    },
                })
                const checkoutUrl = result.data?.createSubscriptionCheckoutSession.checkoutUrl
                if (checkoutUrl === undefined) {
                    setError("The checkout could not be started. Please try again.")
                    return
                }
                window.location.assign(checkoutUrl)
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "The checkout could not be started.")
            }
        })()
    }, [auth.status, createSession, productKey])

    if (auth.status === "signedOut") {
        return <Navigate to={routes.signup.path} replace />
    }

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                {error !== undefined ? (
                    <>
                        <h1 className={styles.heading}>Checkout unavailable</h1>
                        <p className={styles.errorText}>{error}</p>
                        <Link className={styles.backLink} to={routes.home.path}>
                            ← Back
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className={styles.heading}>Starting your checkout…</h1>
                        <p className={styles.subtext}>One moment while we prepare your subscription.</p>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <Spinner size="lg" />
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
