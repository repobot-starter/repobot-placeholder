import React from "react"
import logo from "./repobot-logo.png"
import * as styles from "./BlankPage.styles.css"

/** Landing for the `blank` (no template) pack. */
export default function BlankPage(): React.ReactElement {
    return (
        <main className={styles.page}>
            <img className={styles.logo} src={logo} alt="Repobot" />
            <div className={styles.copy}>
                <p className={styles.lede}>Chat with the agent to start creating.</p>
            </div>
        </main>
    )
}
