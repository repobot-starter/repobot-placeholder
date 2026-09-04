import React from "react"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { tradeLanding } from "./tradeLanding"

/**
 * Home surface for the `trade` pack, composed on the landing kernel
 * (docs/landing.md): `content.ts` stays the single content file and
 * `tradeLanding.ts` maps it into sections — edit either to change the page.
 */
export default function TradePage(): React.ReactElement {
    return <LandingRenderer config={tradeLanding} />
}
