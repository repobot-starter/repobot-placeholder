import React from "react"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { aiTalkLanding } from "./aiTalkLanding"

/**
 * The talk pack's web landing page, composed on the landing kernel
 * (docs/landing.md): the whole page is the config in `aiTalkLanding.ts`.
 * The product itself is the native iOS surface — see packs/talk/PACK.md.
 */
export default function AiTalkPage(): React.ReactElement {
    return <LandingRenderer config={aiTalkLanding} />
}
