import React from "react"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { buildSugarLanding } from "./sugarLanding"

/**
 * Home surface for the `sugar` pack, composed on the landing kernel
 * (docs/landing.md): `content.ts` stays the single content file and
 * `sugarLanding.ts` maps it into sections. The config is built per render
 * so the rotating case and machine status badges (freshness.ts) stay live.
 */
export default function SugarPage(): React.ReactElement {
    return <LandingRenderer config={buildSugarLanding(new Date())} />
}
