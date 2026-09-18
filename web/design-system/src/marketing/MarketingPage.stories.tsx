import type { Meta, StoryObj } from "@storybook/react"
import { MarketingCtaBanner } from "./MarketingCtaBanner"
import { MarketingFaq } from "./MarketingFaq"
import { MarketingFeatureGrid } from "./MarketingFeatureGrid"
import { MarketingFooter } from "./MarketingFooter"
import { MarketingGallery } from "./MarketingGallery"
import { MarketingHero } from "./MarketingHero"
import { MarketingNav } from "./MarketingNav"
import { MarketingPage } from "./MarketingPage"
import { MarketingShowcase } from "./MarketingShowcase"
import { MarketingSocialProof } from "./MarketingSocialProof"
import type { MarketingPresetName } from "./theme/marketingTheme.css"

/**
 * The visual QA gate: the same composed page rendered under each style
 * preset. Two presets should look unrelated while sharing every component.
 */
const meta: Meta<typeof MarketingPage> = {
    title: "Marketing/Presets",
    component: MarketingPage,
}
export default meta

type Story = StoryObj<typeof MarketingPage>

function ComposedPage({ preset }: { preset: MarketingPresetName }): React.ReactElement {
    return (
        <MarketingPage preset={preset}>
            <MarketingNav
                logo={{ emoji: "☀️", name: "Sundial" }}
                links={[
                    { label: "Features", anchor: "feature-grid" },
                    { label: "FAQ", anchor: "faq" },
                ]}
                cta={{ label: "Get started", anchor: "cta-banner" }}
            />
            <MarketingHero
                variant={preset === "editorial" || preset === "brutalist" ? "statement" : "centered-stack"}
                headline="Your team's time, finally visible."
                subheadline="Sundial turns your calendar chaos into a clear picture of where the hours go."
                primaryCta={{ label: "Get started", anchor: "cta-banner" }}
                secondaryCta={{ label: "Learn more", anchor: "feature-grid" }}
            />
            <MarketingSocialProof items={["Northwind", "Fogline", "Basalt", "Meridian Labs"]} />
            <MarketingFeatureGrid
                anchorId="feature-grid"
                kicker="Features"
                title="Everything your week is hiding"
                features={[
                    {
                        emoji: "🗺️",
                        title: "The time map",
                        description: "One glance shows the week's true shape.",
                    },
                    {
                        emoji: "⚖️",
                        title: "Meeting scorecards",
                        description: "Every recurring meeting gets a keep/kill score.",
                    },
                    {
                        emoji: "🔕",
                        title: "Focus guardrails",
                        description: "Blocks fragmentation before it happens.",
                    },
                ]}
            />
            <MarketingFaq
                anchorId="faq"
                kicker="FAQ"
                title="Fair questions"
                items={[
                    {
                        question: "Do you read my meetings?",
                        answer: "No — only event metadata.",
                    },
                    {
                        question: "Can I cancel anytime?",
                        answer: "Yes, one click.",
                    },
                ]}
            />
            <MarketingCtaBanner
                anchorId="cta-banner"
                title="See where your week really goes."
                cta={{ label: "Get started", href: "#" }}
            />
            <MarketingFooter blurb="Built by three ex-calendar-admins." note="· Made with Sundial" />
        </MarketingPage>
    )
}

export const DarkDev: Story = { render: () => <ComposedPage preset="dark-dev" /> }
export const SoftSaas: Story = { render: () => <ComposedPage preset="soft-saas" /> }
export const Editorial: Story = { render: () => <ComposedPage preset="editorial" /> }
export const Brutalist: Story = { render: () => <ComposedPage preset="brutalist" /> }
export const WarmBoutique: Story = { render: () => <ComposedPage preset="warm-boutique" /> }
export const MonoUtility: Story = { render: () => <ComposedPage preset="mono-utility" /> }
export const Atelier: Story = { render: () => <ComposedPage preset="atelier" /> }
export const Heirloom: Story = { render: () => <ComposedPage preset="heirloom" /> }

/**
 * The atelier preset in its intended register: an image-led photography
 * page — full-bleed hero, justified gallery, collection covers. This is
 * the composed QA view for the photography-grade section set.
 */
export const AtelierPhotography: Story = {
    render: () => (
        <MarketingPage preset="atelier">
            <MarketingNav
                logo={{ name: "Mara Voss" }}
                links={[
                    { label: "Work", anchor: "gallery" },
                    { label: "Collections", anchor: "showcase" },
                ]}
                cta={{ label: "Inquire", href: "#" }}
            />
            <MarketingHero
                variant="full-bleed-media"
                badge="Portrait · Editorial"
                headline="Photographs that hold still."
                accent="none"
                subheadline="Mara Voss — portrait and editorial photography, Portland."
                primaryCta={{ label: "See the work", anchor: "gallery" }}
                media={{
                    kind: "image",
                    src: "https://picsum.photos/seed/atelier-hero/2000/1250",
                    alt: "A portrait subject in low window light",
                    width: 2000,
                    height: 1250,
                }}
            />
            <MarketingGallery
                anchorId="gallery"
                variant="justified"
                kicker="Selected work"
                lightbox
                items={[
                    { seed: "at-a", width: 1600, height: 1067 },
                    { seed: "at-b", width: 1067, height: 1600 },
                    { seed: "at-c", width: 1600, height: 1067 },
                    { seed: "at-d", width: 1600, height: 900 },
                    { seed: "at-e", width: 1200, height: 1500 },
                ].map(({ seed, width, height }, index) => ({
                    media: {
                        kind: "image" as const,
                        src: `https://picsum.photos/seed/${seed}/${width}/${height}`,
                        alt: `Selected frame ${index + 1}`,
                        width,
                        height,
                    },
                }))}
            />
            <MarketingShowcase
                anchorId="showcase"
                variant="collections"
                kicker="Collections"
                items={[
                    {
                        title: "Portraits",
                        description: "Studio and location portraiture, 2024–2026.",
                        meta: "24 photographs",
                        media: {
                            kind: "image",
                            src: "https://picsum.photos/seed/at-portraits/1500/1000",
                            alt: "Portraits collection cover",
                            width: 1500,
                            height: 1000,
                        },
                        url: "#",
                    },
                    {
                        title: "Editorial",
                        description: "Commissioned stories for print and web.",
                        meta: "18 photographs",
                        media: {
                            kind: "image",
                            src: "https://picsum.photos/seed/at-editorial/1500/1000",
                            alt: "Editorial collection cover",
                            width: 1500,
                            height: 1000,
                        },
                        url: "#",
                    },
                ]}
            />
            <MarketingFooter blurb="Mara Voss Photography" note="· Portland, OR" />
        </MarketingPage>
    ),
}
