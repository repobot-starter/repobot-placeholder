import type { LandingConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { mailingList, portrait, record } from "./content"

/**
 * The release page's doc-aware tail as a landing config: the kernel
 * sections below the bespoke masthead/excerpt/tracklist/visual region.
 * SinglePage merges it through the landing document under page id "home"
 * (the catalog's seed), so the platform's structural editor can reorder
 * and extend the close of the page. Section ids match the catalog seed.
 */
export function tailLanding(): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.single },
        sections: [
            {
                id: "about",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: record.about.kicker,
                    headline: record.about.title,
                    body: record.about.paragraphs.join(" "),
                    media: { kind: "image" as const, ...portrait },
                },
            },
            {
                id: "mailing-list",
                type: "lead-form",
                variant: "inline-email",
                content: {
                    kicker: mailingList.kicker,
                    title: mailingList.title,
                    body: mailingList.body,
                    cta: mailingList.cta,
                    confirmation: mailingList.confirmation,
                },
            },
        ],
    }
}
