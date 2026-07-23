import React from "react"
import { certifications, commodities, company, journey, partners, shipments, stats } from "./content"
import * as styles from "./TradePage.styles.css"

/**
 * Home surface for the `trade` pack: a marketing site for a trade or
 * supply-chain business, rendered entirely from `content.ts`. An editorial
 * paper-and-ink shell carries the pitch; ops-grade components (KPI strip,
 * journey timeline, live shipment board) carry the proof.
 */
export default function TradePage(): React.ReactElement {
    return (
        <div className={styles.page}>
            <div className={styles.column}>
                <header className={styles.topBar}>
                    <span className={styles.wordmark}>{company.name}</span>
                    <nav className={styles.topBarActions} aria-label="Site">
                        <a className={styles.topBarLink} href="#commodities">
                            Commodities
                        </a>
                        <a className={styles.topBarLink} href="#board">
                            Shipments
                        </a>
                        <a className={styles.ctaButton} href={`mailto:${company.email}`}>
                            Request a quote
                        </a>
                    </nav>
                </header>

                <section className={styles.hero}>
                    <span className={styles.kicker}>{company.kicker}</span>
                    <h1 className={styles.statement}>{company.statement}</h1>
                    <p className={styles.intro}>{company.intro}</p>
                    <div className={styles.heroActions}>
                        <a className={styles.ctaButton} href={`mailto:${company.email}`}>
                            Request a quote
                        </a>
                        <a className={styles.underlineLink} href="#board">
                            See the live board
                        </a>
                    </div>
                </section>

                <section className={styles.statStrip} aria-label="Track record">
                    {stats.map((stat) => (
                        <div key={stat.label} className={styles.statCell}>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                    ))}
                </section>

                <section className={styles.section} id="commodities">
                    <h2 className={styles.sectionHeading}>What we move</h2>
                    <p className={styles.sectionSub}>
                        Every product graded to spec, documented per load, and traceable back to its source.
                    </p>
                    <div className={styles.commodityGrid}>
                        {commodities.map((commodity) => (
                            <article key={commodity.name} className={styles.commodityCard}>
                                <div
                                    className={styles.commodityTile}
                                    style={{ background: commodity.accent }}
                                    aria-hidden
                                >
                                    {commodity.monogram}
                                </div>
                                <div className={styles.commodityBody}>
                                    <h3 className={styles.commodityName}>{commodity.name}</h3>
                                    <div className={styles.commodityChips}>
                                        <span className={styles.commodityChip}>{commodity.spec}</span>
                                        <span className={styles.commodityChip}>{commodity.origin}</span>
                                    </div>
                                    <p className={styles.commodityNote}>{commodity.note}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>How it gets there</h2>
                    <p className={styles.sectionSub}>
                        One team owns the load from the tract to the receiving port — no hand-offs, no black
                        holes.
                    </p>
                    <div className={styles.journeyCard}>
                        {journey.map((step, index) => (
                            <div key={step.title} className={styles.journeyRow}>
                                <div className={styles.journeyRail} aria-hidden>
                                    <span className={styles.journeyBullet} />
                                    {index < journey.length - 1 && <span className={styles.journeyLine} />}
                                </div>
                                <div>
                                    <div className={styles.journeyStep}>Step {index + 1}</div>
                                    <div className={styles.journeyTitle}>{step.title}</div>
                                    <p className={styles.journeyDescription}>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section} id="board">
                    <h2 className={styles.sectionHeading}>On the water right now</h2>
                    <p className={styles.sectionSub}>
                        A live cut of our shipment board — the same one our ops desk works from.
                    </p>
                    <div className={styles.board}>
                        <div className={styles.boardHeader}>
                            <span className={styles.boardTitle}>Shipment board</span>
                            <span className={styles.boardLive}>
                                <span aria-hidden>●</span> Updated daily
                            </span>
                        </div>
                        <table className={styles.boardTable}>
                            <thead>
                                <tr>
                                    <th scope="col">Ref</th>
                                    <th scope="col">Lane</th>
                                    <th scope="col" className={styles.hideNarrow}>
                                        Commodity
                                    </th>
                                    <th scope="col" className={styles.hideNarrow}>
                                        ETA
                                    </th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.map((shipment) => (
                                    <tr key={shipment.ref}>
                                        <td className={styles.refCell}>{shipment.ref}</td>
                                        <td className={styles.laneCell}>{shipment.lane}</td>
                                        <td className={`${styles.mutedCell} ${styles.hideNarrow}`}>
                                            {shipment.commodity}
                                        </td>
                                        <td className={styles.hideNarrow}>{shipment.eta}</td>
                                        <td>
                                            <span
                                                className={styles.statusPill}
                                                style={styles.toneStyles[shipment.tone]}
                                            >
                                                {shipment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>Held to a standard</h2>
                    <div className={styles.certRow}>
                        {certifications.map((certification) => (
                            <span key={certification.code} className={styles.certChip}>
                                <span className={styles.certCode}>{certification.code}</span>
                                <span className={styles.certLabel}>{certification.label}</span>
                            </span>
                        ))}
                    </div>
                    <div className={styles.partnerRow} aria-label="Partners">
                        {partners.map((partner) => (
                            <span key={partner} className={styles.partnerMark}>
                                {partner}
                            </span>
                        ))}
                    </div>
                </section>

                <section className={styles.contactBand}>
                    <h2 className={styles.contactStatement}>Tell us what you need on the water, and when.</h2>
                    <div className={styles.contactActions}>
                        <a className={styles.contactButton} href={`mailto:${company.email}`}>
                            {company.email}
                        </a>
                        <span className={styles.contactMeta}>
                            {company.phone} · {company.location}
                        </span>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <span>
                        © {new Date().getFullYear()} {company.name}
                    </span>
                    <span>Made with TradeBot</span>
                </footer>
            </div>
        </div>
    )
}
