import React from "react"
import { Link } from "react-router-dom"
import * as styles from "./Checkout.styles.css"
import { routes } from "../../Config/Router"
import { shopContent } from "./shopContent"

/** Where buyers land after backing out of checkout. No session state needed. */
export default function CheckoutCancelledPage(): React.ReactElement {
    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.heading}>No charge — see you soon</h1>
                <p className={styles.subtext}>
                    Your checkout was cancelled and nothing was charged. {shopContent.bookTitle} will be right
                    here when you&apos;re ready.
                </p>
                <Link className={styles.backLink} to={routes.home.path}>
                    ← Back to the shop
                </Link>
            </div>
        </main>
    )
}
