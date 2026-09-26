import React from "react"
import { PageMeta } from "../../Seo/PageMeta"
import { useContentHours } from "../Landing/hoursDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useContentMenu } from "../Landing/menuDocument"
import { business, menu, weeklyHours } from "./content"
import { buildMenuLanding } from "./menuLanding"

/**
 * Home surface for the `menu` pack, composed on the landing kernel
 * (docs/landing.md): `content.ts` stays the single content file and
 * `menuLanding.ts` maps it into sections. The config is built per render so
 * the hero's open/closed badge (hours.ts) stays live. Document meta comes
 * from the same content file (docs/seo.md).
 *
 * The week and the card resolve through the business-content contract
 * (repobot.content.json — the Manage UI's write surface) over the code
 * default, live-repainting on dev document edits like the landing merge;
 * the open/closed badge stays computed from the clock whichever side the
 * facts came from.
 */
export default function MenuPage(): React.ReactElement {
    const hours = useContentHours(weeklyHours, "menu")
    const card = useContentMenu(menu, "menu")
    return (
        <>
            <PageMeta title={business.name} siteName={business.name} description={business.description} />
            <LandingRenderer config={buildMenuLanding(new Date(), hours, card)} />
        </>
    )
}
