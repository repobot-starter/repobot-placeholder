import type { MarketingPresetName, MarketingShellConfig } from "@ui"
import { activePack, PackKey } from "../../Config/activePack"
import { bandShell } from "../Band/bandShell"
import { djShell } from "../Dj/djShell"
import { launchShell } from "../Launch/launchShell"
import { singleShell } from "../Single/singleShell"
import { photographyShell } from "../Photography/photographyShell"
import { musicShell } from "../PhotographyMusic/musicShell"
import { servicesShell } from "../Services/servicesShell"
import { servicesEmergencyShell } from "../ServicesEmergency/servicesEmergencyShell"
import { servicesRecurringShell } from "../ServicesRecurring/servicesRecurringShell"
import { estateShell } from "../Estate/estateShell"
import { churchShell } from "../Church/churchShell"
import { communityShell } from "../Community/communityShell"
import { careShell } from "../Care/careShell"
import { fitnessShell } from "../Fitness/fitnessShell"
import { trainerShell } from "../FitnessTrainer/trainerShell"
import { yogaShell } from "../FitnessYoga/yogaShell"
import { folioShell } from "../Folio/folioShell"
import { fundIndexShell } from "../FundIndex/fundIndexShell"
import { galaShell } from "../Gala/galaShell"
import { nonprofitShell } from "../Nonprofit/nonprofitShell"
import { resumeShell } from "../Resume/resumeShell"
import { reunionShell } from "../Reunion/reunionShell"
import { vowsShell } from "../Vows/vowsShell"
import { weddingShell } from "../Wedding/weddingShell"
import { PACK_REGISTERS } from "./packRegisters.gen"
import { saasShell } from "./saasShell"

/**
 * Pack-owned chrome for manifest pages. Packs whose marketing pages are
 * code (photography's Work/About/Inquire) render their own shell and style
 * preset instead of the blueprint-derived ones — so a page added from the
 * platform's Pages panel wears the same masthead and register as the pack's
 * own pages, not different chrome over a clashing style. Packs absent here
 * (all manifest-driven templates) keep the blueprint shell, whose links
 * already derive from the manifest.
 *
 * Only chrome *builders* belong here (they must stay light — this rides in
 * the shared SitePage chunk); never a pack's page content.
 */
export interface PackSiteChrome {
    shell: MarketingShellConfig
    /** The pack pages' own preset — manifest pages match it, not the manifest default. */
    preset: MarketingPresetName
}

const chromeByPack: Partial<Record<PackKey, (pagePath: string) => PackSiteChrome>> = {
    photography: (pagePath) => ({
        shell: photographyShell("", pagePath),
        preset: PACK_REGISTERS.photography,
    }),
    "photography-music": (pagePath) => ({
        shell: musicShell("", pagePath),
        preset: PACK_REGISTERS["photography-music"],
    }),
    wedding: (pagePath) => ({ shell: weddingShell("", pagePath), preset: PACK_REGISTERS.wedding }),
    services: (pagePath) => ({
        shell: servicesShell("", pagePath),
        preset: PACK_REGISTERS.services,
    }),
    "services-emergency": (pagePath) => ({
        shell: servicesEmergencyShell("", pagePath),
        preset: PACK_REGISTERS["services-emergency"],
    }),
    "services-recurring": (pagePath) => ({
        shell: servicesRecurringShell("", pagePath),
        preset: PACK_REGISTERS["services-recurring"],
    }),
    estate: (pagePath) => ({ shell: estateShell("", pagePath), preset: PACK_REGISTERS.estate }),
    vows: (pagePath) => ({ shell: vowsShell("", pagePath), preset: PACK_REGISTERS.vows }),
    gala: (pagePath) => ({ shell: galaShell("", pagePath), preset: PACK_REGISTERS.gala }),
    reunion: (pagePath) => ({ shell: reunionShell("", pagePath), preset: PACK_REGISTERS.reunion }),
    folio: (pagePath) => ({ shell: folioShell("", pagePath), preset: PACK_REGISTERS.folio }),
    resume: (pagePath) => ({ shell: resumeShell("", pagePath), preset: PACK_REGISTERS.resume }),
    care: (pagePath) => ({ shell: careShell("", pagePath), preset: PACK_REGISTERS.care }),
    fitness: (pagePath) => ({ shell: fitnessShell("", pagePath), preset: PACK_REGISTERS.fitness }),
    "fitness-yoga": (pagePath) => ({
        shell: yogaShell("", pagePath),
        preset: PACK_REGISTERS["fitness-yoga"],
    }),
    "fitness-trainer": (pagePath) => ({
        shell: trainerShell("", pagePath),
        preset: PACK_REGISTERS["fitness-trainer"],
    }),
    church: (pagePath) => ({ shell: churchShell("", pagePath), preset: PACK_REGISTERS.church }),
    nonprofit: (pagePath) => ({
        shell: nonprofitShell("", pagePath),
        preset: PACK_REGISTERS.nonprofit,
    }),
    community: (pagePath) => ({
        shell: communityShell("", pagePath),
        preset: PACK_REGISTERS.community,
    }),
    "fund-index": (pagePath) => ({
        shell: fundIndexShell("", pagePath),
        preset: PACK_REGISTERS["fund-index"],
    }),
    launch: (pagePath) => ({ shell: launchShell("", pagePath), preset: PACK_REGISTERS.launch }),
    saas: (pagePath) => ({ shell: saasShell(pagePath), preset: PACK_REGISTERS.saas }),
    band: (pagePath) => ({ shell: bandShell("", pagePath), preset: PACK_REGISTERS.band }),
    dj: (pagePath) => ({ shell: djShell("", pagePath), preset: PACK_REGISTERS.dj }),
    single: () => ({ shell: singleShell(), preset: PACK_REGISTERS.single }),
}

/** Packs that own their site chrome — conformance tests assert every
 * doc-aware pack (catalog `landing.routes`) appears here, so its manifest
 * pages wear the pack's masthead instead of the blueprint default. */
export const packsWithSiteChrome: readonly PackKey[] = Object.keys(chromeByPack) as PackKey[]

/** The active pack's chrome for a manifest page at `pagePath`, if the pack owns its site chrome. */
export function packSiteChrome(pagePath: string): PackSiteChrome | undefined {
    return chromeByPack[activePack.key]?.(pagePath)
}
