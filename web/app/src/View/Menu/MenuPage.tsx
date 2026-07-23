import React, { useMemo, useState } from "react"
import { business, dietaryLabels, formatPrice, hoursNote, menu, weeklyHours, type MenuItem } from "./content"
import { dayNames, formatMinute, statusAt, statusLabel } from "./hours"
import * as styles from "./MenuPage.styles.css"

type Dietary = "V" | "VG" | "GF"

function itemMatches(item: MenuItem, filters: Dietary[]): boolean {
    return filters.every((f) => item.dietary.includes(f))
}

export default function MenuPage(): React.ReactElement {
    const [activeSection, setActiveSection] = useState(menu[0]?.title ?? "")
    const [filters, setFilters] = useState<Dietary[]>([])

    // The current time is read once per render pass; hours logic itself is pure.
    const now = new Date()
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    const status = statusAt(weeklyHours, day, minute)
    const label = statusLabel(weeklyHours, day, minute)

    const section = useMemo(() => menu.find((s) => s.title === activeSection) ?? menu[0], [activeSection])
    const visibleItems = section.items.filter((item) => itemMatches(item, filters))

    const toggleFilter = (mark: Dietary): void => {
        setFilters((current) =>
            current.includes(mark) ? current.filter((f) => f !== mark) : [...current, mark],
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <header className={styles.hero}>
                    <h1 className={styles.wordmark}>{business.name}</h1>
                    <p className={styles.taglineText}>{business.tagline}</p>
                    <div className={styles.statusBadge}>
                        <span
                            className={status.open ? styles.statusDotOpen : styles.statusDotClosed}
                            aria-hidden
                        />
                        {label}
                    </div>
                    <p className={styles.descriptionText}>{business.description}</p>
                </header>

                <nav className={styles.sectionTabs} aria-label="Menu sections">
                    {menu.map((s) => (
                        <button
                            key={s.title}
                            type="button"
                            className={`${styles.sectionTab} ${s.title === section.title ? styles.sectionTabActive : ""}`}
                            onClick={() => setActiveSection(s.title)}
                        >
                            {s.title}
                        </button>
                    ))}
                </nav>

                <div className={styles.dietaryRow}>
                    {(Object.keys(dietaryLabels) as Dietary[]).map((mark) => (
                        <button
                            key={mark}
                            type="button"
                            className={`${styles.dietaryChip} ${filters.includes(mark) ? styles.dietaryChipActive : ""}`}
                            onClick={() => toggleFilter(mark)}
                        >
                            {dietaryLabels[mark]}
                        </button>
                    ))}
                </div>

                {section.note ? <p className={styles.sectionNote}>{section.note}</p> : null}

                <div className={styles.itemList}>
                    {visibleItems.map((item, index) => (
                        <div
                            key={item.name}
                            className={styles.itemRow}
                            style={{ animationDelay: `${index * 40}ms` }}
                        >
                            <div className={styles.itemText}>
                                <span className={styles.itemName}>
                                    {item.name}
                                    {item.popular ? (
                                        <span className={styles.popularStar}>Popular</span>
                                    ) : null}
                                    {item.dietary.map((mark) => (
                                        <span
                                            key={mark}
                                            className={styles.dietaryMark}
                                            title={dietaryLabels[mark]}
                                        >
                                            {mark}
                                        </span>
                                    ))}
                                </span>
                                <div className={styles.itemDescription}>{item.description}</div>
                            </div>
                            <span className={styles.itemPrice}>{formatPrice(item.priceCents)}</span>
                        </div>
                    ))}
                    {visibleItems.length === 0 ? (
                        <p className={styles.emptyNote}>
                            Nothing in {section.title.toLowerCase()} fits that filter — try another section.
                        </p>
                    ) : null}
                </div>

                <div className={styles.infoGrid}>
                    <section>
                        <h2 className={styles.infoTitle}>Hours</h2>
                        <div className={styles.hoursTable}>
                            {dayNames.map((name, d) => {
                                const entry = weeklyHours.find((h) => h.day === d)
                                const text = entry
                                    ? entry.intervals
                                          .map(
                                              ([open, close]) =>
                                                  `${formatMinute(open)} – ${formatMinute(close)}`,
                                          )
                                          .join(", ")
                                    : "Closed"
                                return (
                                    <div key={name} className={styles.hoursRow}>
                                        <span
                                            className={`${styles.hoursDay} ${d === day ? styles.hoursToday : ""}`}
                                        >
                                            {name}
                                        </span>
                                        <span className={d === day ? styles.hoursToday : ""}>{text}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <p className={styles.hoursNoteText}>{hoursNote}</p>
                    </section>
                    <section>
                        <h2 className={styles.infoTitle}>Find us</h2>
                        <div className={styles.contactList}>
                            <span>{business.address}</span>
                            <a
                                className={styles.contactLink}
                                href={`https://maps.google.com/?q=${encodeURIComponent(business.mapsQuery)}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Get directions →
                            </a>
                            <a
                                className={styles.contactLink}
                                href={`tel:${business.phone.replace(/[^0-9+]/g, "")}`}
                            >
                                {business.phone}
                            </a>
                            <a className={styles.contactLink} href={`mailto:${business.email}`}>
                                {business.email}
                            </a>
                            <a
                                className={styles.contactLink}
                                href={business.instagram}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Instagram →
                            </a>
                        </div>
                    </section>
                </div>

                <footer className={styles.footer}>
                    {business.name} — {business.tagline}. Built with Repobot.
                </footer>
            </div>
        </div>
    )
}
