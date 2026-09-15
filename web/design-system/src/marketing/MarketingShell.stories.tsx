import type { Meta, StoryObj } from "@storybook/react"
import { MarketingHero } from "./MarketingHero"
import { MarketingPage } from "./MarketingPage"
import { MarketingShell } from "./MarketingShell"

const meta: Meta<typeof MarketingShell> = {
    title: "Marketing/Shell",
    component: MarketingShell,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <MarketingPage preset="soft-saas">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingShell>

const links = [
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
]

const body = (
    <MarketingHero
        variant="centered-stack"
        headline="Chrome around every page"
        subheadline="The shell renders the nav and footer once; sections stay page content."
        primaryCta={{ label: "Get started", anchor: "lead-form" }}
    />
)

export const InlineNavSimpleFooter: Story = {
    args: {
        nav: {
            variant: "inline",
            content: {
                logo: { name: "Northwind" },
                links,
                cta: { label: "Get started", href: "/signup" },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: "Northwind",
                links,
                note: "© 2026 Northwind",
            },
        },
        children: body,
    },
}

export const CenteredNavWithAnnouncement: Story = {
    args: {
        nav: {
            variant: "centered",
            content: {
                logo: { name: "Northwind", emoji: "🧭" },
                links,
                cta: { label: "Sign in", href: "/login" },
                announcement: "Series A — we're hiring across the board",
            },
        },
        children: body,
    },
}

export const BurgerOverlayNav: Story = {
    args: {
        nav: {
            variant: "burger-overlay",
            content: {
                logo: { name: "Northwind" },
                links,
                cta: { label: "Get started", href: "/signup" },
            },
        },
        children: body,
    },
}

export const FullWidthNav: Story = {
    args: {
        nav: {
            variant: "full-width",
            content: {
                logo: { name: "Northwind" },
                links,
                cta: { label: "Get started", href: "/signup" },
            },
        },
        children: body,
    },
}

export const SplitNav: Story = {
    args: {
        nav: {
            variant: "split",
            content: {
                logo: { name: "Northwind" },
                links,
                cta: { label: "Start free trial", href: "/signup" },
            },
        },
        children: body,
    },
}

export const PillLinksNav: Story = {
    args: {
        nav: {
            variant: "pill-links",
            content: {
                logo: { name: "Northwind" },
                links,
                cta: { label: "Sign in", href: "/login" },
            },
        },
        children: body,
    },
}

export const LogoOnlyNav: Story = {
    args: {
        nav: {
            variant: "logo-only",
            content: {
                logo: { name: "Northwind" },
            },
        },
        children: body,
    },
}

export const MultiColumnFooter: Story = {
    args: {
        footer: {
            variant: "multi-column",
            content: {
                blurb: "Northwind is the fastest way to chart a course through your data.",
                columns: [
                    { title: "Product", links },
                    {
                        title: "Company",
                        links: [
                            { label: "Blog", href: "/blog" },
                            { label: "Contact", href: "/contact" },
                        ],
                    },
                ],
                note: "© 2026 Northwind",
            },
        },
        children: body,
    },
}

export const NewsletterFooter: Story = {
    args: {
        footer: {
            variant: "newsletter",
            content: {
                blurb: "Northwind is the fastest way to chart a course through your data.",
                newsletter: {
                    title: "Ship notes, monthly",
                    placeholder: "you@example.com",
                    cta: "Subscribe",
                    confirmation: "You're subscribed — see you next month.",
                },
                columns: [{ title: "Product", links }],
                note: "© 2026 Northwind",
            },
        },
        newsletterJoined: false,
        onNewsletterSubmit: () => undefined,
        children: body,
    },
}
