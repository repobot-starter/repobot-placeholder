import React, { useMemo, useState } from "react"
import { about, allTags, profile, projects, socials } from "./content"
import * as styles from "./FolioPage.styles.css"

/**
 * Home surface for the `folio` pack: a one-page portfolio rendered entirely
 * from `content.ts` — hero statement, filterable project grid, about, and a
 * contact CTA. Owners edit content.ts to make it theirs.
 */
export default function FolioPage(): React.ReactElement {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const tags = useMemo(() => allTags(), [])
    const visibleProjects = activeTag
        ? projects.filter((project) => project.tags.includes(activeTag))
        : projects

    // The statement's last word gets the accent italic — a cheap trick that
    // makes any sentence in content.ts look art-directed.
    const words = profile.statement.split(" ")
    const lead = words.slice(0, -1).join(" ")
    const lastWord = words[words.length - 1]

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <nav className={styles.nav}>
                    <span className={styles.monogram}>{profile.name}</span>
                    <div className={styles.navLinks}>
                        <a className={styles.navLink} href="#work">
                            Work
                        </a>
                        <a className={styles.navLink} href="#about">
                            About
                        </a>
                    </div>
                    <a className={styles.contactButton} href={`mailto:${profile.email}`}>
                        Get in touch
                    </a>
                </nav>

                <header className={styles.hero}>
                    {profile.availability ? (
                        <span className={styles.availability}>
                            <span className={styles.availabilityDot} aria-hidden />
                            {profile.availability}
                        </span>
                    ) : null}
                    <h1 className={styles.statement}>
                        {lead} <span className={styles.statementAccent}>{lastWord}</span>
                    </h1>
                    <div className={styles.heroMeta}>
                        <span>{profile.role}</span>
                        <span>·</span>
                        <span>{profile.location}</span>
                    </div>
                </header>

                <section id="work" className={styles.workSection} aria-label="Selected work">
                    <span className={styles.sectionKicker}>Selected work</span>
                    <h2 className={styles.sectionTitle}>Things I'm proud of</h2>

                    <div className={styles.filterRow} role="group" aria-label="Filter projects">
                        <button
                            type="button"
                            className={styles.filterChip}
                            aria-pressed={activeTag === null}
                            onClick={() => setActiveTag(null)}
                        >
                            All
                        </button>
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={styles.filterChip}
                                aria-pressed={activeTag === tag}
                                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className={styles.projectGrid}>
                        {visibleProjects.map((project) => (
                            <a
                                key={project.title}
                                className={styles.projectCard}
                                href={project.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <div
                                    className={styles.projectArt}
                                    style={{ background: project.accent }}
                                    aria-hidden
                                >
                                    {project.emoji}
                                </div>
                                <div className={styles.projectBody}>
                                    <div className={styles.projectTitleRow}>
                                        <h3 className={styles.projectTitle}>{project.title}</h3>
                                        <span className={styles.projectYear}>{project.year}</span>
                                    </div>
                                    <p className={styles.projectDescription}>{project.description}</p>
                                    <div className={styles.projectTags}>
                                        {project.tags.map((tag) => (
                                            <span key={tag} className={styles.projectTag}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                <section id="about" className={styles.aboutSection} aria-label="About">
                    <div>
                        <span className={styles.sectionKicker}>About</span>
                        <h2 className={styles.sectionTitle}>The short version</h2>
                        {about.paragraphs.map((paragraph) => (
                            <p key={paragraph.slice(0, 24)} className={styles.aboutParagraph}>
                                {paragraph}
                            </p>
                        ))}
                    </div>
                    <div className={styles.skillsCloud}>
                        {about.skills.map((skill) => (
                            <span key={skill} className={styles.skillChip}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </section>

                <section className={styles.contactSection} aria-label="Contact">
                    <h2 className={styles.contactHeadline}>Let's make something.</h2>
                    <a className={styles.contactEmail} href={`mailto:${profile.email}`}>
                        {profile.email}
                    </a>
                    <div className={styles.footerRow}>
                        {socials.map((social) => (
                            <a
                                key={social.label}
                                className={styles.footerLink}
                                href={social.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {social.label}
                            </a>
                        ))}
                        <span>·</span>
                        <span>Made with FolioBot</span>
                    </div>
                </section>
            </div>
        </div>
    )
}
