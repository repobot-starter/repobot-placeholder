import React from "react"
import { brand, contact, howItWorks, lineups, machines } from "./content"
import {
    epochDay,
    formatPrice,
    lineupIndexForDay,
    statusAt,
    type StatusKind,
} from "./freshness"
import * as styles from "./SugarPage.styles.css"

const statusClassByKind: Record<StatusKind, string> = {
    fresh: styles.statusFresh,
    sellingFast: styles.statusSellingFast,
    upcoming: styles.statusUpcoming,
    soldOut: styles.statusSoldOut,
    closed: styles.statusClosed,
}

export default function SugarPage(): React.ReactElement {
    const now = new Date()
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    const lineup = lineups[lineupIndexForDay(epochDay(now), lineups.length)]

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <header className={styles.hero}>
                    <h1 className={styles.wordmark}>{brand.name}</h1>
                    <p className={styles.tagline}>{brand.tagline}</p>
                    <p className={styles.story}>{brand.story}</p>
                </header>

                <div className={styles.machineScene} aria-hidden>
                    <div className={styles.machineBody}>
                        <div className={styles.machineHeader}>{brand.name}</div>
                        <div className={styles.machineWindow}>
                            {[...lineup.pastries, ...lineup.pastries]
                                .slice(0, 6)
                                .map((pastry, index) => (
                                    <span key={index} className={styles.machineShelfItem}>
                                        {pastry.emoji}
                                    </span>
                                ))}
                        </div>
                        <div className={styles.machineSlot}>tap · grab · go</div>
                    </div>
                </div>

                <h2 className={styles.sectionTitle}>How it works</h2>
                <p className={styles.sectionKicker}>Same promise at every machine, every day.</p>
                <div className={styles.stepRow}>
                    {howItWorks.map((step, index) => (
                        <div
                            key={step.title}
                            className={styles.stepCard}
                            style={{ animationDelay: `${index * 80}ms` }}
                        >
                            <span className={styles.stepEmoji} aria-hidden>
                                {step.emoji}
                            </span>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepText}>{step.text}</p>
                        </div>
                    ))}
                </div>

                <h2 className={styles.sectionTitle}>Today's case</h2>
                <p className={styles.sectionKicker}>
                    The lineup rotates every morning — whatever's in the bin was baked overnight.
                </p>
                <span className={styles.caseTitleBadge}>{lineup.title}</span>
                <div className={styles.pastryList}>
                    {lineup.pastries.map((pastry, index) => (
                        <div
                            key={pastry.name}
                            className={styles.pastryCard}
                            style={{ animationDelay: `${index * 70}ms` }}
                        >
                            <span className={styles.pastryEmoji} aria-hidden>
                                {pastry.emoji}
                            </span>
                            <div className={styles.pastryText}>
                                <h3 className={styles.pastryName}>{pastry.name}</h3>
                                <p className={styles.pastryDescription}>{pastry.description}</p>
                            </div>
                            <span className={styles.pastryPrice}>{formatPrice(pastry.priceCents)}</span>
                        </div>
                    ))}
                </div>

                <h2 className={styles.sectionTitle}>Find a machine</h2>
                <p className={styles.sectionKicker}>Live from the bins — statuses update with the clock.</p>
                <div className={styles.machineList}>
                    {machines.map((machine, index) => {
                        const status = statusAt(machine.schedule, day, minute)
                        return (
                            <div
                                key={machine.name}
                                className={styles.machineCard}
                                style={{ animationDelay: `${index * 70}ms` }}
                            >
                                <div className={styles.machineTop}>
                                    <div>
                                        <h3 className={styles.machineName}>{machine.name}</h3>
                                        <p className={styles.machineSpot}>{machine.spot}</p>
                                    </div>
                                    <span className={statusClassByKind[status.kind]}>{status.label}</span>
                                </div>
                                {machine.note ? <p className={styles.machineNote}>{machine.note}</p> : null}
                            </div>
                        )
                    })}
                </div>

                <div className={styles.hostBlock}>
                    <h2 className={styles.hostTitle}>{contact.hostPitch}</h2>
                    <a className={styles.hostButton} href={`mailto:${contact.email}`}>
                        Talk to us
                    </a>
                </div>
                <p className={styles.donationNote}>{contact.donationNote}</p>

                <footer className={styles.footer}>
                    <a
                        className={styles.footerLink}
                        href={contact.instagram}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Instagram
                    </a>{" "}
                    · {brand.name} · Built with Repobot
                </footer>
            </div>
        </div>
    )
}
