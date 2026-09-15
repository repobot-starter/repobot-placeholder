import type { Meta, StoryObj } from "@storybook/react"
import { MarketingBrowserFrame } from "./MarketingBrowserFrame"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingBrowserFrame> = {
    title: "Marketing/BrowserFrame",
    component: MarketingBrowserFrame,
    decorators: [
        (Story) => (
            <MarketingPage preset="soft-saas">
                <div style={{ maxWidth: 720, margin: "48px auto" }}>
                    <Story />
                </div>
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingBrowserFrame>

export const WithAddressBar: Story = {
    args: {
        src: "/showcase/waypoint-dashboard.png",
        alt: "The Waypoint workspace overview",
        url: "waypoint.app/overview",
    },
}

export const DotsOnly: Story = {
    args: {
        src: "/showcase/waypoint-dashboard.png",
        alt: "The Waypoint workspace overview",
    },
}
