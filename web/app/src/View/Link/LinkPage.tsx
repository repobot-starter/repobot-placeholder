import React, { useEffect, useState } from "react"
import { links, profile, socials, themes, type LinkTheme, type ThemeKey } from "./content"
import * as styles from "./LinkPage.styles.css"

const THEME_STORAGE_KEY = "linkbot-theme"

function loadTheme(): LinkTheme {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeKey | null
    return themes.find((theme) => theme.key === saved) ?? themes[0]
}

/**
 * Home surface for the `link` pack: a link-in-bio page rendered entirely from
 * `content.ts`. Visitors can cycle theme palettes (persisted locally) and
 * share the page; owners edit content.ts to make it theirs.
 */
export default function LinkPage(): React.ReactElement {
    const [theme, setTheme] = useState<LinkTheme>(loadTheme)
    const [shareLabel, setShareLabel] = useState("Share this page")

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, theme.key)
    }, [theme])

    const handleShare = (): void => {
        const url = window.location.href
        if (navigator.share) {
            void navigator.share({ title: profile.name, url }).catch(() => undefined)
            return
        }
        void navigator.clipboard.writeText(url).then(() => {
            setShareLabel("Link copied!")
            setTimeout(() => setShareLabel("Share this page"), 2000)
        })
    }

    // The active palette flows into the stylesheet through CSS custom
    // properties, so themes stay plain data in content.ts.
    const themeVars = {
        "--lb-background": theme.background,
        "--lb-surface": theme.surface,
        "--lb-border": theme.surfaceBorder,
        "--lb-text": theme.text,
        "--lb-subtle": theme.subtleText,
        "--lb-accent": theme.accent,
    } as React.CSSProperties

    return (
        <div className={styles.page} style={themeVars}>
            <main className={styles.column}>
                <header className={styles.header}>
                    <div className={styles.avatar} aria-hidden>
                        {profile.avatarEmoji}
                    </div>
                    <h1 className={styles.name}>{profile.name}</h1>
                    <span className={styles.handle}>{profile.handle}</span>
                    <p className={styles.bio}>{profile.bio}</p>
                    <span className={styles.location}>📍 {profile.location}</span>
                </header>

                <nav className={styles.socialRow} aria-label="Social profiles">
                    {socials.map((social) => (
                        <a
                            key={social.label}
                            className={styles.socialChip}
                            href={social.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={social.label}
                        >
                            {social.monogram}
                        </a>
                    ))}
                </nav>

                <nav className={styles.linkList} aria-label="Links">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            className={styles.linkRow}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span className={styles.linkEmoji} aria-hidden>
                                {link.emoji}
                            </span>
                            <span className={styles.linkText}>
                                <span className={styles.linkLabel}>{link.label}</span>
                                <span className={styles.linkNote}>{link.note}</span>
                            </span>
                            <span className={styles.linkArrow} aria-hidden>
                                ↗
                            </span>
                        </a>
                    ))}
                </nav>

                <button type="button" className={styles.shareButton} onClick={handleShare}>
                    {shareLabel}
                </button>

                <footer className={styles.footer}>
                    <div className={styles.themeRow} role="group" aria-label="Theme">
                        {themes.map((candidate) => (
                            <button
                                key={candidate.key}
                                type="button"
                                className={styles.themeSwatch}
                                style={{ background: candidate.background }}
                                aria-label={`${candidate.label} theme`}
                                aria-pressed={candidate.key === theme.key}
                                onClick={() => setTheme(candidate)}
                            />
                        ))}
                    </div>
                    <span className={styles.madeWith}>Made with LinkBot</span>
                </footer>
            </main>
        </div>
    )
}
