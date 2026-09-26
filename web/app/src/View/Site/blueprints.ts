import { marketingShellNavVariants } from "@ui"
import type {
    LandingConfig,
    LandingSection,
    MarketingAccentPlacement,
    MarketingBackdropArt,
    MarketingCta,
    MarketingHeroContent,
    MarketingPresetName,
    MarketingShellConfig,
    MarketingShellNavVariant,
} from "@ui"
import type { MarketingPageBlueprint, MarketingPageEntry } from "../../Config/projectManifest"
import { projectManifest } from "../../Config/projectManifest"
import { packSiteChrome } from "./packShell"
import { sectionsFromManifest } from "./sectionsFromManifest"

/**
 * Default `LandingConfig` builders for the marketing page blueprints in
 * `repobot.project.json` (docs/project-ia.md). Each builder produces a
 * complete, presentable page from just `{ title, description }` using the
 * landing kernel vocabulary (docs/landing.md) — placeholder copy the agent
 * replaces during the content pass. Cross-page nav links derive from the
 * manifest's page list, so adding a page rewires every nav automatically.
 *
 * A page's `seed` — the copy and hero image the user wrote during setup —
 * renders verbatim over the placeholders (`seededHero`, `seedKeyPoints`):
 * the user's words appear before any agent runs, and the agent's content
 * pass builds around them instead of inventing.
 *
 * A page with an inline `landing` config bypasses these builders entirely
 * (`landingConfigForPage`); that is the editing surface for custom pages.
 */

interface BlueprintContext {
    page: MarketingPageEntry
    /** All manifest pages, for cross-page nav links. */
    pages: MarketingPageEntry[]
    /** Brand name for nav logos and copy. */
    siteName: string
    /** The site's style preset — blueprints art-direct around it. */
    preset: MarketingPresetName
}

/**
 * Per-preset art direction for the landing blueprint. One shared skeleton
 * wearing eight presets used to produce eight near-identical pages —
 * hero variant, backdrop art, accent grammar, badge, CTA pairing, and
 * section variants now follow the preset's character, so the untouched
 * skeleton already looks like a decision. Media-led hero variants only
 * apply when the seed carries a hero image; an empty split reads as a
 * mistake, not a style.
 */
interface LandingDirection {
    heroVariant: "centered-stack" | "split-media" | "statement"
    /** Generated art behind the landing hero (zero-asset, accent-keyed). */
    heroBackdrop?: MarketingBackdropArt
    /** Where the headline's accent word lands; `none` is pure typography. */
    heroAccent: MarketingAccentPlacement
    /** The pill above the headline; omitted registers read cleaner bare. */
    heroBadge?: string
    /** Whether a secondary CTA rides beside the primary. */
    heroSecondaryCta: boolean
    featureVariant: "cards-3up" | "icon-list"
    stepsVariant: "numbered-cards" | "timeline"
    /**
     * The contact page's form lean: a quick email capture, or the
     * multi-field inquiry form (name/email/company/message). The
     * contact-block variant needs real channels, so only a manifest
     * section (or the agent) chooses it.
     */
    leadFormVariant: "inline-email" | "detail-form"
}

const LANDING_DIRECTIONS: Record<MarketingPresetName, LandingDirection> = {
    "dark-dev": {
        heroVariant: "centered-stack",
        heroBackdrop: "aurora",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    "soft-saas": {
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    editorial: {
        // Magazine grammar: the sentence opens on the accent, no pill, one
        // decisive CTA — the typography is the art direction.
        heroVariant: "statement",
        heroAccent: "first-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    brutalist: {
        // Raw ink: no accent color in the headline, no badge, one CTA.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    "warm-boutique": {
        // Sunlit warmth sells itself — the launch-status pill reads salesy.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    "mono-utility": {
        // Spec-sheet restraint: monospace type carries the page bare.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    "aurora-dark": {
        heroVariant: "centered-stack",
        heroBackdrop: "aurora",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    "luxe-light": {
        heroVariant: "centered-stack",
        heroBackdrop: "beams",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    atelier: {
        // Gallery quiet: bare tracked type, no badge, no accent word, one
        // CTA — the page recedes so imagery carries the register. Without
        // a seed image the statement hero holds the wall on type alone.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    heirloom: {
        // Invitation grammar: the serif statement opens like a save-the-date,
        // the closing word set in the register's italic flourish, no pill,
        // one quiet CTA — warmth comes from the paper and the type, never
        // from launch-page dressing.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    tourbook: {
        // Expedition masthead: the uppercase statement is the cover of the
        // tour book; the closing word is set in ink. (The
        // media-led masthead-overlay needs a seed photograph, so the
        // blueprint holds the type-only reading.)
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    monolith: {
        // Monumental type IS the page: the statement at the register's
        // display scale, the closing word stroke-only (the outline
        // treatment), no pill, no second ask, everything ruled in
        // hairlines.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    lanternlight: {
        // The marquee over the night: serif statement with the italic
        // flourish on the close, one CTA — the white string-light glow
        // and the midnight paper carry the celebration.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    sitework: {
        // Jobsite signage: the split hero shows the work beside stenciled
        // uppercase lettering, the closing word in safety orange. Two
        // asks — trades convert on the call as much as the quote form.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    brownstone: {
        // The listing sheet opens on the serif statement, the closing
        // word in the register's italic; one quiet CTA — photography
        // carries the register, so the type-only blueprint stays reserved.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    marquee: {
        // The playbill opens on the uppercase statement, the closing word
        // in the register's italic; one CTA — the photographs are the
        // show, so the type-only blueprint stays a title card.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    chalk: {
        // The whiteboard wall: stenciled uppercase statement, no accent
        // word (the monochrome registers read cleaner bare), one hard
        // chalk-plate CTA.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    hymnal: {
        // The midnight service opens on the monumental uppercase
        // statement, the closing word in candle amber — one CTA, ruled in
        // hairlines. Reverence through boldness; the type preaches.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    ballroom: {
        // The engraved invitation: the monumental serif statement with the
        // italic flourish on the close, no pill, one gold-plate ask —
        // the spotlight sweep and the hairline frames carry the evening.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    picnic: {
        // The party flyer: friendly rounded type front and center, two
        // asks (a party converts on "I'm in" and "tell me more" alike),
        // numbered cards like games on the lawn.
        heroVariant: "centered-stack",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    broadside: {
        // The poster opens on the masthead statement, bare — uppercase
        // display past the monumental ceiling wants no accent word or
        // badge chrome, the way a bill names the band and nothing else.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    crt: {
        // The prompt: centered mono type on the tube, the closing word in
        // phosphor — no pill, one command. Terminals list, so features
        // read as `ls` output and steps as a session transcript.
        heroVariant: "centered-stack",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    handheld: {
        // The title screen: chunky uppercase mono, centered like a boot
        // logo, no accent word (four shades of one green — the accent IS
        // the ink), features as cartridge cards, steps as numbered levels.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    lounge: {
        // The night lounge opens on the statement with the closing word in
        // the accent's glow; two asks — play now, browse the catalog.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    retroware: {
        // The welcome dialog: centered copy over the accent-washed
        // desktop, the closing word in hyperlink accent, two beveled
        // buttons (OK and the second ask), features as dialog cards.
        heroVariant: "centered-stack",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    tideline: {
        // The film-title open: the thin serif statement set bare (no
        // accent word — the amber is saved for the ask), one CTA, and the
        // process down the hairline rail. The photograph does the selling.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    memphis: {
        // The flyer: the promise beside the crew photo with the closing
        // word popped, a starburst sticker, two ink-cut buttons, features
        // as sticker cards, and the process as a rail you read like a day.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    jacaranda: {
        // The sign-writer's opener: painted show-card caps in purple ink
        // with the closing word brushed in script, two asks (call and
        // quote), steps as painted boards.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    tabloid: {
        // The inside page of the daily: a left-set condensed headline,
        // bare (red is the masthead's ink, not a word-level accent), one
        // ask; features and steps set as ruled column lists, never cards.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    gameday: {
        // The drop campaign: the promise in white block caps with the
        // closing word leaning volt, two asks (plan and call), features as
        // jersey-patch cards, the process as a season rail.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    creature: {
        // The one-sheet: the poster title over the art with the last word
        // dripping orange, two asks, features as lobby cards, the process
        // numbered like reels.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    riso: {
        // The print shop's poster: a two-line condensed shout set bare
        // (orange is the second drum, saved for the ask and the prints),
        // one ask, features as a quiet list, the process down the ruled
        // timeline, one season per line.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    paintchip: {
        // The color studio's open: the headline beside the photograph with
        // the closing word striped in the accent, two asks, features as
        // flat chip cards, steps as numbered cards.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    schematic: {
        // The flyer headline: wide extended caps with the closing word in
        // cyan current, one ask; features and steps drawn as ruled lists
        // on the drafting film, never cards.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    sunbelt: {
        // The motel sign: the promise beside the photograph under a
        // rising sun, the closing word in hot orange, two asks, features
        // as sun-bleached cards.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    crown: {
        // The cover: the name cast in chrome with its last word in gold
        // beside the cover photograph, two asks, features as gold-framed
        // cards, steps as numbered cards.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    vanity: {
        // The counter card: a Didone statement set bare with its last
        // word in lipstick, one ask, features as a quiet ruled list, the
        // process down the hairline timeline.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    midcentury: {
        // The catalog cover: the headline in condensed caps beside the room
        // it describes, its closing full stop in mustard, one ask; features
        // as the numbered catalog strip, the process down the ruled timeline.
        heroVariant: "split-media",
        heroAccent: "full-stop",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    photobooth: {
        // The zine's cover: the marker headline set bare and big (the pink
        // is saved for the ask), one ask; features as a typed list, the
        // story down the timeline.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    disco: {
        // The supper club's card: the Didone line with its closing word in
        // lacquer red, one ask; features as gilt cards, the night's running
        // order down the timeline.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    wayfinding: {
        // The station sign: the promise in heavy caps on the green panel
        // beside the photograph, one ask; features as pictogram rows, the
        // route down the ruled timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    groove: {
        // The LP sleeve: the title beside the square cover with the last
        // word in amber, two asks, features as liner-note cards, the
        // process numbered like tracks.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    inkblot: {
        // The gallery poster: a huge centered title over the artwork, one
        // quiet ask; features as wall labels, the process down a ruled
        // timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    bubblegum: {
        // The candy shop: inflated caps beside the photograph with the
        // last word in cherry, two asks, features as glossy pill cards.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    snapshot: {
        // The fridge door: the two-line shout beside a taped print, its
        // closing word in marker red, one ask; features as taped cards,
        // the process as numbered prints.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    rodeo: {
        // The rodeo bill: wood-type caps beside the roped photograph, the
        // closing word in sunset orange, two asks; features as ticket
        // cards, the process numbered like events on the bill.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    vitrine: {
        // The sitter's wall: the portrait beside a quiet serif line, one
        // ask; features as a plain list, the process down a ruled line.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    seamless: {
        // The headshot studio: one face beside one plain sentence, one
        // ask; features as a plain list, the session numbered.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    liner: {
        // The liner notes: the photograph beside a short credit line, one
        // ask; features as a plain list, the process numbered like tracks.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    seafog: {
        // The coastal morning: the names centered on the mist, one ask;
        // features as a plain list, the day down a ruled line.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    harvest: {
        // The orchard table: the names centered on the green, one ask;
        // features as a plain list, the weekend down a ruled line.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    carton: {
        // The faire-part: the names set enormous with no photograph, one
        // ask; features as a plain list, the day down a ruled line.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    daybook: {
        // The wedding-morning album: a light headline with no accent word,
        // one soft ask; the process as the hour-by-hour timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    jharokha: {
        // The jewel box: the name centered under the lotus, the last word
        // in gold, one ask; features as gold-framed cards, the weekend
        // numbered day by day.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    horizon: {
        // The coastal masthead: the name in wide tracked caps, no accent
        // word, one quiet ask; features as a plain list, the build as a
        // timeline.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    shingle: {
        // The engraved quarterly: the title set over the photograph, an
        // italic accent word, a quiet second ask; features as a plain
        // list, the build as a timeline.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    limestone: {
        // The private atelier: a Didone headline over the suite, no accent
        // word, one quiet ask; features as a plain list, the visit as
        // numbered steps.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    cognac: {
        // The ritual room: a display serif over the portrait, no accent
        // word, one ask; features as a plain list, the visit as a timeline.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    plantroom: {
        // The plant room's ledger: the condensed statement beside the
        // photograph, its last word in copper, one quiet ask; features as
        // an icon list, the process a timeline in the spec voice.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    stormline: {
        // The dispatch desk: the promise beside the photograph with the
        // call and a second ask; features as cards, the process numbered.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    plaster: {
        // The garden journal: an italic sentence opening on its accent, one
        // ask; features as a quiet list, the process a timeline.
        heroVariant: "statement",
        heroAccent: "first-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    basalt: {
        // The garden walk: light type, no accent word, one ask; the
        // process a timeline, features a list.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    whiteglove: {
        // The white house: black type beside the photograph, no accent
        // word, one square ask; features as hairline cards.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    palmbeach: {
        // The club notice: the italic line beside the photograph, its last
        // word the accent, two asks; features as notice cards.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    parlor: {
        // The parlor: the headline beside the photograph, its last line in
        // the italic, two asks; features as engraved icon rows, the process
        // down one gilt line.
        heroVariant: "split-media",
        heroAccent: "last-line",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    trailhead: {
        // The trail journal: the headline beside the photograph, plain (no
        // accent), two asks; features as icon cards, the process as a
        // numbered set of notes.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    hearth: {
        // The lounge: the headline beside the photograph with its last
        // line in the accent, two asks; features as icon cards, the
        // process as numbered cards on a band.
        heroVariant: "split-media",
        heroAccent: "last-line",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    boreal: {
        // Winter indoors: the headline beside the photograph, two asks;
        // features as icon cards, the process as one quiet line of steps.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    schist: {
        // The architect's monograph: the photograph and the line beside
        // it, no accent word, the work and a letter as the two asks;
        // features as a plain ruled list, steps as a timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    galleyproof: {
        // The one-line page: the line alone at poster scale, its full
        // stop in proof red, no photograph; features as a plain list,
        // steps as a timeline.
        heroVariant: "statement",
        heroAccent: "full-stop",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    colophon: {
        // The press: the headline beside the photograph with its last line
        // in the display italic, two asks; features as ruled entries, the
        // process as numbered columns.
        heroVariant: "split-media",
        heroAccent: "last-line",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    terrazzo: {
        // The lakeside studio: a quiet sans headline beside the photograph,
        // no accent, two asks; features as icon rows, the process down a
        // ruled timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    picturebook: {
        // The storybook first visit: a soft serif headline set centered like
        // a title page, one warm ask; features as a ruled strip of facts,
        // the visit told as numbered pages.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    seaglass: {
        // The ocean-view practice: a tall serif headline beside the
        // photograph, two asks; features as icon rows, the care path down a
        // ruled timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    limone: {
        // The Italian coast on film: one quiet line over the photograph,
        // features as three cards, the process as numbered cards.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    alpine: {
        // The expedition field sheet: one line low on the photograph,
        // features as a ruled list, the process as a timeline.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    milkglass: {
        // The daylight studio: one soft line over the window light,
        // features as three cards, the process as a timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    darkroom: {
        // The print room: one engraved statement, features as a ruled list,
        // the process as a timeline.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    buttercream: {
        // The picnic invitation: a soft serif line beside the photograph,
        // no accent word, one ask; features as a plain list.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    vineyard: {
        // The family dinner: a classic serif line beside the photograph,
        // no accent word, one ask; features as a plain list.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    adobe: {
        // The birth house: a calm serif line beside the photograph, no
        // accent word, the tour and the midwives as the two asks; steps
        // down a timeline, the way care unfolds.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    fogline: {
        // The fertility clinic: a narrow serif line beside the photograph,
        // no accent word, the consultation and the numbers as the two asks;
        // features as a plain list, steps as numbered cards.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    limewash: {
        // The plaster studio: one quiet serif line beside the room, no
        // accent word, the visit as the one ask; features as a plain list,
        // steps as a timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    miradouro: {
        // The creator's diary: a light serif line beside the photograph,
        // the accent word in italic, the two asks as text links; features
        // as a plain list, steps as a timeline.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    sprocket: {
        // The film creator: a heavy condensed line beside the photograph,
        // no accent word, the fits and the brief as the two asks; features
        // as a plain list, steps as numbered cards.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    galley: {
        // The chef's résumé: the name beside the photograph with its last
        // word in the italic, the work and the email as the asks; features
        // as a quiet list, steps down the timeline rail.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    baylight: {
        // The waterfront agent: the line set light beside the photograph,
        // no accent word, the listings and a call as the two asks;
        // features as a plain list, steps as a timeline.
        heroVariant: "split-media",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
}

/**
 * The shared page chrome: sticky nav and footer, derived from the manifest's
 * page list so adding a page rewires every nav automatically. The current
 * page drops out of its own links. Variants come from the manifest's
 * `marketing.shell` (chosen during setup); unknown or absent nav values fall
 * back to the preset's nav lean (`NAV_VARIANT_BY_PRESET`), then the theme
 * contract's `navigation.variant` (`repobot.theme.json`, resolved inside
 * `MarketingShell`), then `full-width`; footers fall back to `simple`.
 */
/**
 * The preset's nav lean — the chrome is part of the register's art
 * direction, not one band every site wears. The translucent full-width
 * band (the kernel default) is a tech-product treatment, so the dark
 * tech registers keep it; the others carry the bar treatment their
 * character asks for: brutalist's hard rules and warm-boutique's sunlit
 * warmth want the contained inline card, editorial wants the squared
 * ruled bar, soft-saas the friendly pill cluster, and luxe-light the
 * centered-logo masthead. A manifest-pinned `navVariant` still wins.
 */
const NAV_VARIANT_BY_PRESET: Partial<Record<MarketingPresetName, MarketingShellNavVariant>> = {
    brutalist: "inline",
    "warm-boutique": "inline",
    editorial: "split",
    "soft-saas": "pill-links",
    "luxe-light": "centered",
    // The gallery register wants the quiet centered masthead.
    atelier: "centered",
    // The stationery register reads as a letterhead: wordmark on the left,
    // links ruled off to the right — deliberately apart from atelier's
    // centered gallery masthead.
    heirloom: "split",
    // The tour book opens on a centered masthead, like a poster's title
    // block; lanternlight's marquee reads the same way. Monolith keeps the
    // kernel's translucent full-width band — the dark tech treatment.
    tourbook: "centered",
    lanternlight: "centered",
    // The trades register hangs its nav like a shop sign: the contained
    // inline card, same lean as warm-boutique's counter.
    sitework: "inline",
    // The residential register reads as a letterhead — the agency name on
    // the left, links ruled off to the right, heirloom's lean.
    brownstone: "split",
    // The stage register wants maximal dark: the burger overlay keeps the
    // chrome to a wordmark so the full-bleed frames own the viewport.
    marquee: "burger-overlay",
    // The gala opens on a centered masthead like the program at the door;
    // the picnic wears the friendly pill cluster — name tags on a string,
    // not another contained card.
    ballroom: "centered",
    picnic: "pill-links",
    // The training-floor register hangs its links like the club rules
    // board: squared ruled bar, the free-trial CTA a size up.
    chalk: "split",
    // The midnight-service register hangs its nav like a venue's bar:
    // squared ruled band, the Give CTA a size up on the right.
    hymnal: "split",
    // The poster register rules its nav off like the imprint line at the
    // foot of a bill: squared split bar, ink hairline underneath, the CTA
    // a size up — conversion chrome that still reads as print.
    broadside: "split",
    // The terminal hangs its links like a status bar: wordmark left,
    // links ruled off right — a tmux bar, not a marketing band.
    crt: "split",
    // The handheld's nav is a cartridge label: the contained inline card.
    handheld: "inline",
    // The lounge wears the pill cluster — playlist chips on the rail.
    lounge: "pill-links",
    // The silver machine's nav is a title bar: wordmark left, links
    // right, ruled off in chrome.
    retroware: "split",
    // The coastal timber house keeps its chrome to a quiet letterhead:
    // wordmark left, links ruled off right, so the photograph under it
    // owns the first screen.
    tideline: "split",
    // The flyer's masthead: wordmark left, links ruled off right on an ink
    // rule — the band a club flyer runs its title in.
    memphis: "split",
    // The sign-painted trade hangs its nav like the van-door sign: the
    // contained inline card, the call a painted red board.
    jacaranda: "inline",
    // The daily hangs its nameplate dead center over the ruled section
    // links — the front page's flag, not a product bar.
    tabloid: "centered",
    // The campaign's nav is the team bar: the italic wordmark and its city
    // left, links right, the one ask a volt plate.
    gameday: "full-width",
    // The one-sheet's nav is the marquee card over the poster: wordmark,
    // links, and the booking ask in one contained bar.
    creature: "inline",
    // The print shop hangs its nav across the sheet like a poster's top
    // line: wordmark left, links, the ask boxed on the right.
    riso: "full-width",
    // The color deck centers its wordmark like the name on a fan deck's
    // spine, links and the ask either side.
    paintchip: "centered",
    // The flyer's header runs edge to edge like the top of a club bill:
    // wordmark left, links tracked out, the call a glowing cyan frame.
    schematic: "full-width",
    // The motel sign's marquee: the wordmark centered over its links.
    sunbelt: "centered",
    // The cover's top line: the dateline left, the sections tracked out
    // across the bar, the ask underlined on the right.
    crown: "full-width",
    // The counter's letterhead: the wordmark stacked over its tagline on
    // the left, the links spaced wide, the ask boxed on the right.
    vanity: "split",
    // The catalog's masthead: the wordmark and its city on the left, ruled
    // off from the links, the ask a mustard block on the right.
    midcentury: "split",
    // The zine's masthead: the couple's names and their city left, links
    // typed out right, the RSVP a pink tag.
    photobooth: "split",
    // The supper club's awning: the script name left, links ruled off in
    // gold on the right.
    disco: "split",
    // The transit system hangs its nav as the sign band over the platform:
    // edge to edge, wordmark left, destinations right.
    wayfinding: "full-width",
    // The sleeve's title strip: the wordmark centered over the tracklist.
    groove: "centered",
    // The gallery letterhead: wordmark left, catalogue links ruled off right.
    inkblot: "split",
    // Candy on a string: the friendly pill cluster.
    bubblegum: "pill-links",
    // The fridge door's header is a note along the top: wordmark left,
    // links and the ask right.
    snapshot: "split",
    // The ranch sign: brand mark and name on the left, the links and the
    // ask strung along the rail to the right.
    rodeo: "inline",
    // The sitter's wall keeps its chrome to a name and a menu: the
    // wordmark left, everything else folded behind the burger.
    vitrine: "burger-overlay",
    // The headshot studio's letterhead: the name left, links ruled off
    // right.
    seamless: "split",
    // The sleeve's spine: the name left, the sections run right.
    liner: "split",
    // The coast and the orchard keep their chrome to the names and a
    // menu, out of the photograph's way.
    seafog: "burger-overlay",
    harvest: "burger-overlay",
    // The card's letterhead: the names left, the pages ruled off right.
    carton: "split",
    // The album's cover line: the name on the left, the links and the pill
    // ask to the right.
    daybook: "inline",
    // The studio's sign: the name centered over the lotus, the links
    // balanced either side.
    jharokha: "centered",
    // The masthead: the name alone, the links folded behind the menu.
    horizon: "burger-overlay",
    // The letterhead: the firm's name left, the pages and the ask inline.
    shingle: "inline",
    // The suite door: the name left, one quiet link to reserve.
    limestone: "inline",
    // The studio door: the name left, one link to book.
    cognac: "inline",
    // The plant room's letterhead: the spaced wordmark left, links ruled off right.
    plantroom: "split",
    // The dispatch desk runs its bar edge to edge, the call boxed on the right.
    stormline: "full-width",
    // The garden studio's letterhead: the italic wordmark over its links.
    plaster: "centered",
    // The garden walk's chrome is a quiet line: wordmark left, links right.
    basalt: "split",
    // The house's letterhead: the wordmark and its line left, links right.
    whiteglove: "split",
    // The club's crest centered over its links.
    palmbeach: "centered",
    // The engraved card: the name centered over its links, like a
    // letterpress calling card.
    parlor: "centered",
    // The trail sign: the name at the left, the way on at the right.
    trailhead: "inline",
    hearth: "pill-links",
    // The title page: the imprint at the left, the contents at the right.
    colophon: "split",
    // Winter indoors: the name alone at the left, one quiet menu button.
    boreal: "burger-overlay",
    // The studio's letterhead: wordmark left, links spaced right.
    terrazzo: "split",
    picturebook: "centered",
    seaglass: "split",
    // The studio's name as the masthead, links in small caps beneath.
    limone: "centered",
    // The name left in wide capitals, the legend of links right.
    alpine: "split",
    // The name in thin capitals left, the links spaced right.
    milkglass: "split",
    // The engraved name left, the links in engraved capitals right.
    darkroom: "split",
    // The picnic: the name and one ask, floating over the photograph.
    buttercream: "burger-overlay",
    // The dinner invitation: the name centered over its links, floating over the photograph.
    vineyard: "centered",
    // The birth house: the name left, the rooms right, floating over the photograph.
    adobe: "full-width",
    // The clinic: the name left, the rooms right, floating over the fog.
    fogline: "full-width",
    // The plaster studio: the name in caps left, the rooms right, floating over the first room.
    limewash: "full-width",
    // The creator's diary: the name in italic left, the pages right, floating over the photograph.
    miradouro: "full-width",
    // The film creator: the name left, the pages right, a hard rule under the bar.
    sprocket: "split",
    galley: "split",
    // The waterfront agent: the name in the display serif left, the pages right, floating over the water.
    baylight: "full-width",
    // The architect's monograph: the practice left, the pages spread right in tracked caps, over the first plate.
    schist: "split",
    // The galley proof: the wordmark and a burger, nothing else over the line.
    galleyproof: "burger-overlay",
}

function shellForContext(context: BlueprintContext): MarketingShellConfig {
    const links: MarketingCta[] = context.pages
        .filter((page) => page.id !== context.page.id)
        .map((page) => ({ label: page.title, href: page.path }))
    // An app-shaped project surfaces its app from the marketing chrome: the
    // nav CTA becomes the first declared dashboard destination (the saas
    // pack's "Sign in" precedent, and the same landing postAuthRoutePath
    // gives sign-ins), so a scaffolded dashboard is one click from the site
    // home — never a route the visitor must know to type. ProtectedRoutes
    // bounces through /login and back when the visitor isn't signed in.
    const appEntry = projectManifest.dashboard.destinations[0]
    const appEntryCta: MarketingCta | undefined =
        appEntry !== undefined ? { label: appEntry.label, href: appEntry.path } : undefined
    const shell = projectManifest.marketing.shell
    const navVariant =
        marketingShellNavVariants.find((variant) => variant === shell?.navVariant) ??
        NAV_VARIANT_BY_PRESET[context.preset]
    const footerVariant = (["simple", "multi-column", "newsletter"] as const).find(
        (variant) => variant === shell?.footerVariant,
    )
    const note = `© ${new Date().getFullYear()} ${context.siteName}`
    return {
        nav: {
            ...(navVariant !== undefined ? { variant: navVariant } : {}),
            content: {
                // The committed brand logo (setup stamps marketing.brand
                // when the user uploads one) rides every derived nav, so
                // manifest pages carry the real mark with no hand-wiring.
                logo: {
                    name: context.siteName,
                    ...(projectManifest.marketing.brand?.logo
                        ? { imageSrc: projectManifest.marketing.brand.logo }
                        : {}),
                },
                links,
                cta: appEntryCta ?? primaryAction(context),
            },
        },
        footer: {
            variant: footerVariant ?? "simple",
            content:
                footerVariant === "multi-column" || footerVariant === "newsletter"
                    ? {
                          blurb: context.siteName,
                          columns: links.length > 0 ? [{ title: "Pages", links }] : [],
                          note,
                          ...(footerVariant === "newsletter"
                              ? {
                                    newsletter: {
                                        title: "Stay in the loop",
                                        placeholder: "you@example.com",
                                        cta: "Subscribe",
                                        confirmation: "Thanks — you're on the list.",
                                    },
                                }
                              : {}),
                      }
                    : {
                          blurb: context.siteName,
                          links: appEntryCta !== undefined ? [...links, appEntryCta] : links,
                          note,
                      },
        },
    }
}

/** The nav CTA: the contact page when one exists, else the on-page lead form. */
function primaryAction(context: BlueprintContext): MarketingCta {
    const contact = context.pages.find((page) => page.blueprint === "contact" && page.id !== context.page.id)
    if (contact !== undefined) {
        return { label: "Get in touch", href: contact.path }
    }
    return { label: "Get started", anchor: "lead-form" }
}

/**
 * The blueprint's default hero with every `seed` field the user wrote
 * applied over it: headline, subheadline, and primary-CTA label replace the
 * placeholders; a pinned hero image fills the hero's media slot (each
 * variant places media sensibly, so the variant itself stays).
 */
function seededHero(
    page: MarketingPageEntry,
    variant: "centered-stack" | "split-media" | "statement" | "form-first" | "product-frame",
    content: MarketingHeroContent,
): LandingSection {
    const seed = page.seed
    return {
        type: "hero",
        variant,
        content: {
            ...content,
            ...(seed?.headline !== undefined ? { headline: seed.headline } : {}),
            ...(seed?.subheadline !== undefined ? { subheadline: seed.subheadline } : {}),
            ...(seed?.ctaLabel !== undefined && content.primaryCta !== undefined
                ? { primaryCta: { ...content.primaryCta, label: seed.ctaLabel } }
                : {}),
            ...(seed?.heroImage !== undefined
                ? { media: { kind: "image" as const, src: seed.heroImage, alt: page.title } }
                : {}),
        },
    }
}

/**
 * The user's key points as a section of their own — rendered as written,
 * replacing (landing) or joining (other blueprints) the placeholder
 * sections. Undefined when the seed has none.
 */
function seedKeyPoints(page: MarketingPageEntry): LandingSection | undefined {
    const bullets = page.seed?.bullets ?? []
    if (bullets.length === 0) {
        return undefined
    }
    return {
        type: "feature-grid",
        variant: "icon-list",
        content: {
            kicker: "On this page",
            features: bullets.slice(0, 8).map((bullet) => ({
                emoji: "✦",
                title: bullet,
                description: "",
            })),
        },
    }
}

function landingBlueprint(context: BlueprintContext): LandingSection[] {
    const { page, siteName } = context
    const keyPoints = seedKeyPoints(page)
    const direction = LANDING_DIRECTIONS[context.preset]
    // Media-led heroes need media: without a seed image, fall back to the
    // centered stack instead of rendering a lopsided empty split.
    const heroVariant =
        direction.heroVariant === "split-media" && page.seed?.heroImage === undefined
            ? "centered-stack"
            : direction.heroVariant
    const hero = seededHero(page, heroVariant, {
        ...(direction.heroBadge !== undefined ? { badge: direction.heroBadge } : {}),
        headline: `Meet ${siteName}`,
        accent: direction.heroAccent,
        subheadline: page.description ?? "One clear sentence about who this helps and how.",
        primaryCta: primaryAction(context),
        ...(direction.heroSecondaryCta
            ? { secondaryCta: { label: "See how it works", anchor: "steps" } }
            : {}),
        // Generated art keyed to the theme accent — the skeleton's hero is
        // never a flat page even before any asset exists. A seeded hero
        // image supersedes it (seededHero fills the media slot; art stays
        // behind as ground).
        ...(direction.heroBackdrop !== undefined ? { backdrop: { art: direction.heroBackdrop } } : {}),
    })
    return [
        hero,
        // The user's own points replace the placeholder pitch wholesale.
        keyPoints ?? {
            type: "feature-grid",
            variant: direction.featureVariant,
            content: {
                kicker: "Why it works",
                title: "Built around three things",
                features: [
                    {
                        emoji: "⚡",
                        title: "Fast to start",
                        description: "Describe the first thing people get value from, in one sentence.",
                    },
                    {
                        emoji: "🎯",
                        title: "Focused by design",
                        description: "Describe what this does better than the way people do it today.",
                    },
                    {
                        emoji: "🔒",
                        title: "Yours to keep",
                        description: "Describe the trust angle — privacy, ownership, or reliability.",
                    },
                ],
            },
        },
        {
            type: "steps",
            variant: direction.stepsVariant,
            content: {
                kicker: "How it works",
                title: "Three steps, no setup",
                steps: [
                    {
                        title: "Sign up",
                        description: "What the very first action is and how little it asks for.",
                    },
                    {
                        title: "Set it up",
                        description: "What happens next and why it takes minutes, not days.",
                    },
                    {
                        title: "See results",
                        description: "The outcome — what the user has at the end of day one.",
                    },
                ],
            },
        },
        {
            type: "lead-form",
            content: {
                kicker: "Stay in the loop",
                title: "Get early access",
                placeholder: "you@example.com",
                cta: "Join the list",
                confirmation: "You're on the list — we'll be in touch soon.",
            },
        },
    ]
}

/** The preset's accent grammar, shared by every page of the site. */
function accentForContext(context: BlueprintContext): MarketingAccentPlacement {
    return LANDING_DIRECTIONS[context.preset].heroAccent
}

function pricingBlueprint(context: BlueprintContext): LandingSection[] {
    const keyPoints = seedKeyPoints(context.page)
    return [
        seededHero(context.page, "statement", {
            headline: "Pricing that stays out of the way",
            accent: accentForContext(context),
            subheadline: context.page.description ?? "Start free, upgrade when it earns it.",
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "pricing",
            content: {
                kicker: "Plans",
                title: "Pick what fits today",
                tiers: [
                    {
                        name: "Starter",
                        monthly: 0,
                        yearlyPerMonth: 0,
                        description: "For trying it out.",
                        features: ["The core workflow", "One project", "Community support"],
                    },
                    {
                        name: "Pro",
                        monthly: 19,
                        yearlyPerMonth: 15,
                        description: "For daily use.",
                        features: ["Everything in Starter", "Unlimited projects", "Priority support"],
                        highlighted: true,
                        badge: "Most popular",
                    },
                    {
                        name: "Team",
                        monthly: 49,
                        yearlyPerMonth: 39,
                        description: "For working together.",
                        features: ["Everything in Pro", "Shared workspaces", "Admin controls"],
                    },
                ],
            },
        },
        {
            type: "faq",
            content: {
                kicker: "Billing",
                title: "Common questions",
                items: [
                    {
                        question: "Can I change plans later?",
                        answer: "Yes — upgrades and downgrades apply at the next billing cycle.",
                    },
                    {
                        question: "Is there a free trial?",
                        answer: "The Starter plan is free forever; paid plans start when you choose one.",
                    },
                    {
                        question: "How do I cancel?",
                        answer: "From your account settings, any time. Your data stays exportable.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            content: {
                title: "Ready when you are",
                body: "Start on the free plan — no card required.",
                cta: primaryAction(context),
            },
        },
    ]
}

function aboutBlueprint(context: BlueprintContext): LandingSection[] {
    const { page, siteName } = context
    const keyPoints = seedKeyPoints(page)
    return [
        seededHero(page, "statement", {
            headline: `The story behind ${siteName}`,
            accent: accentForContext(context),
            subheadline: page.description ?? "Two or three sentences on why this exists and who builds it.",
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "steps",
            content: {
                kicker: "What we value",
                title: "How we work",
                steps: [
                    {
                        title: "Keep it simple",
                        description: "A principle about the product — what you refuse to complicate.",
                    },
                    {
                        title: "Earn trust",
                        description: "A principle about the relationship — support, privacy, honesty.",
                    },
                    {
                        title: "Ship steadily",
                        description: "A principle about the craft — how improvements actually arrive.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            content: {
                title: "Come say hello",
                body: "Questions, ideas, or just curious — we read everything.",
                cta: primaryAction(context),
            },
        },
    ]
}

function contactBlueprint(context: BlueprintContext): LandingSection[] {
    const { page, siteName } = context
    const keyPoints = seedKeyPoints(page)
    // The form itself follows the preset's lean: a quick email capture for
    // product registers, the multi-field inquiry form (detail-form) for
    // registers whose contact page reads like a conversation opener.
    const variant = LANDING_DIRECTIONS[context.preset].leadFormVariant
    return [
        seededHero(page, "statement", {
            headline: `Talk to ${siteName}`,
            accent: accentForContext(context),
            subheadline:
                page.description ??
                (variant === "detail-form"
                    ? "Tell us a little about what you need and we'll get back to you within a day."
                    : "Leave your email and we'll get back to you within a day."),
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "lead-form",
            variant,
            content: {
                title: "Send us a note",
                placeholder: "you@example.com",
                cta: "Send",
                confirmation: "Thanks — we'll be in touch shortly.",
            },
        },
    ]
}

function faqBlueprint(context: BlueprintContext): LandingSection[] {
    const keyPoints = seedKeyPoints(context.page)
    return [
        seededHero(context.page, "statement", {
            headline: "Questions, answered",
            accent: accentForContext(context),
            subheadline: context.page.description ?? "Everything people usually ask before they start.",
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "faq",
            content: {
                title: "Frequently asked",
                items: [
                    {
                        question: "What is this?",
                        answer: "One plain-language sentence describing the product.",
                    },
                    {
                        question: "Who is it for?",
                        answer: "The audience and the situation where it fits best.",
                    },
                    {
                        question: "How much does it cost?",
                        answer: "The one-line pricing answer, with a pointer to the pricing page.",
                    },
                    {
                        question: "How do I get help?",
                        answer: "Where support lives and how quickly it responds.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            content: {
                title: "Still curious?",
                body: "The fastest way to find out is to try it.",
                cta: primaryAction(context),
            },
        },
    ]
}

function customBlueprint(context: BlueprintContext): LandingSection[] {
    const { page } = context
    const keyPoints = seedKeyPoints(page)
    return [
        seededHero(page, "statement", {
            headline: page.title,
            accent: accentForContext(context),
            subheadline: page.description ?? "Describe this page in a sentence, then compose its sections.",
            ...(page.seed?.ctaLabel !== undefined ? { primaryCta: primaryAction(context) } : {}),
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "cta-banner",
            content: {
                title: "This page is a starting point",
                body: "Replace it with real sections from the landing kernel vocabulary.",
                cta: primaryAction(context),
            },
        },
    ]
}

const blueprintBuilders: Record<MarketingPageBlueprint, (context: BlueprintContext) => LandingSection[]> = {
    landing: landingBlueprint,
    pricing: pricingBlueprint,
    about: aboutBlueprint,
    contact: contactBlueprint,
    faq: faqBlueprint,
    custom: customBlueprint,
}

/**
 * A blueprint page rendered outside the manifest: the marketing gallery
 * (/theme/marketing) uses this to show exactly what a fresh project ships
 * for each blueprint, under any preset, without touching the repo's own
 * repobot.project.json. The caller supplies the site fiction (pages, name);
 * sections and shell derive the same way `landingConfigForPage` derives
 * them for real manifest pages.
 */
export function blueprintExemplarConfig(request: {
    page: MarketingPageEntry
    pages: MarketingPageEntry[]
    siteName: string
    preset: MarketingPresetName
}): LandingConfig {
    const context: BlueprintContext = {
        page: request.page,
        pages: request.pages,
        siteName: request.siteName,
        preset: request.preset,
    }
    return {
        style: { preset: request.preset },
        shell: shellForContext(context),
        sections: blueprintBuilders[request.page.blueprint](context),
    }
}

/**
 * Resolve a manifest page to its full config. Precedence: an inline
 * `landing` config wins outright; then the page's `sections[]` scaffold
 * (mapped by `sectionsFromManifest`); then the blueprint default. The
 * shared shell chrome wraps both non-inline paths.
 */
export function landingConfigForPage(page: MarketingPageEntry): LandingConfig {
    if (page.landing !== undefined) {
        return page.landing
    }
    const { marketing } = projectManifest
    // Packs with code-owned site chrome (photography's masthead + atelier
    // register) dress manifest pages in it, so platform-added pages match
    // the site instead of wearing blueprint chrome over a clashing preset.
    const packChrome = packSiteChrome(page.path)
    const preset = packChrome?.preset ?? marketing.preset
    const context: BlueprintContext = {
        page,
        pages: marketing.pages,
        siteName:
            marketing.siteName ?? marketing.pages.find((entry) => entry.path === "/")?.title ?? "Our site",
        preset,
    }
    // Scaffold heroes without their own accent grammar inherit the preset's
    // direction, so a manifest-scaffolded site reads as coherently
    // art-directed as a blueprint-built one.
    const scaffold = sectionsFromManifest(page)?.map((section) =>
        section.type === "hero" && section.content.accent === undefined
            ? { ...section, content: { ...section.content, accent: accentForContext(context) } }
            : section,
    )
    return {
        style: { preset },
        shell: packChrome?.shell ?? shellForContext(context),
        sections: scaffold ?? blueprintBuilders[page.blueprint](context),
    }
}
