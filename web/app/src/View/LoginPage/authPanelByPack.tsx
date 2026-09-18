import { Avatar, Button, StatCard } from "@ui"
import React from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { approvals, formatUsdExact, formatUsd, totalInWindow, weeklyTrend } from "../Spend/spendData"
import * as styles from "./authPanelByPack.styles.css"

/**
 * Pack-provided art for the sign-in panel (the AuthShell `panelSlot` /
 * `panelFooter`), keyed like packShell's chromeByPack: real components over
 * the pack's own demo data, so the front door previews the product in the
 * live theme — never a screenshot that can drift. Packs without an entry
 * keep the plain copy-only panel.
 */

export interface AuthPanelArt {
    panelSlot?: React.ReactNode
    panelFooter?: React.ReactNode
}

/** A static product fragment: interactive components rendered as art. */
function Fragment({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <div className={styles.fragment} aria-hidden>
            {children}
        </div>
    )
}

function SpendPanelArt(): React.ReactElement {
    const approval = approvals[0]
    return (
        <>
            <Fragment>
                <StatCard
                    label="Spend this month"
                    value={formatUsd(totalInWindow(30, 0))}
                    hint="vs prior 30 days"
                    trend={weeklyTrend()}
                />
            </Fragment>
            <Fragment>
                <div className={styles.approvalRow}>
                    <Avatar name={approval.member.name} size="md" />
                    <div className={styles.approvalBody}>
                        <span className={styles.approvalName}>{approval.member.name}</span>
                        <span className={styles.approvalMeta}>
                            {approval.merchant} — {formatUsdExact(approval.amountCents)}
                        </span>
                    </div>
                    <Button size="sm">Approve</Button>
                </div>
            </Fragment>
        </>
    )
}

const artByPack: Partial<Record<PackKey, () => AuthPanelArt>> = {
    saas: () => ({
        panelSlot: <SpendPanelArt />,
        panelFooter: (
            <span>
                “Every dollar is accounted for before the month closes — and nobody chases receipts anymore.”
                — Elena Ruiz, Head of Finance, Marlin Labs
            </span>
        ),
    }),
}

/** The active pack's panel art, or an empty object for copy-only panels. */
export function authPanelArt(): AuthPanelArt {
    return artByPack[activePack.key]?.() ?? {}
}
