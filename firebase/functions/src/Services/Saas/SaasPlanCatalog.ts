import { RpcError } from "../../Utils/RpcError.js"
import { PaymentProduct } from "../Payments/index.js"

/**
 * The saas pack's plan catalog, server-side so the price a subscriber is
 * charged can never be tampered with from the client. The starter (Outlay)
 * sells two paid plans (Growth and Scale, monthly); agents growing the
 * product add entries here and pass their keys through
 * CreateSubscriptionCheckoutSessionFields.productKey.
 *
 * Presentation copy (the pricing page's tiers, features, FAQs) lives in the
 * project IA manifest (repobot.project.json); this file is only what
 * subscription checkout needs to charge correctly. Keep the two in sync when
 * prices change.
 */

export interface SaasPlan extends PaymentProduct {
    kind: "subscription"
    interval: "month" | "year"
}

export const saasPlans: SaasPlan[] = [
    {
        key: "growth",
        name: "Growth plan",
        priceMinorUnits: 2900,
        currency: "usd",
        kind: "subscription",
        interval: "month",
    },
    {
        key: "scale",
        name: "Scale plan",
        priceMinorUnits: 7900,
        currency: "usd",
        kind: "subscription",
        interval: "month",
    },
]

/**
 * Resolves a plan for subscription checkout. No key means the default
 * (first) plan, so single-plan products never send one.
 */
export function getSaasPlan(productKey?: string | null): SaasPlan {
    if (productKey === undefined || productKey === null) {
        return saasPlans[0]
    }
    const plan = saasPlans.find((candidate) => candidate.key === productKey)
    if (plan === undefined) {
        const known = saasPlans.map((candidate) => candidate.key).join(", ")
        throw new RpcError("NOT_FOUND", `Unknown plan '${productKey}'. Known plans: ${known}.`)
    }
    return plan
}
