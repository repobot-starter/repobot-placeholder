import React from "react"
import { shouldShowSpaceboyFooter } from "../../Config/publishedSiteBranding"

const footerStyle: React.CSSProperties = {
    position: "fixed",
    right: 12,
    bottom: 10,
    zIndex: 20,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--ui-text-secondary, rgba(255,255,255,0.7))",
    textDecoration: "none",
    opacity: 0.9,
}

export default function PublishedFreeFooter(): React.ReactElement | null {
    if (!shouldShowSpaceboyFooter()) {
        return null
    }
    return (
        <a href="https://spaceboy.ai" target="_blank" rel="noreferrer noopener" style={footerStyle}>
            Made with Spaceboy
        </a>
    )
}
