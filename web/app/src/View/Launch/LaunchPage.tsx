import React, { useState } from "react"
import { faq, features, footer, pricing, product, steps } from "./content"
import * as styles from "./LaunchPage.styles.css"

const WAITLIST_KEY = "launchbot-waitlist-email"

/**
 * Home surface for the `launch` pack: a startup landing page rendered
 * entirely from `content.ts` — hero with waitlist capture, social proof,
 * features, how-it-works, pricing with a billing toggle, FAQ, and footer.
 *
 * The waitlist stores locally (this pack is client-only); PACK.md documents
 * the upgrade path to a real backend inbox.
 */
export default function LaunchPage(): React.ReactElement {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
    const [email, setEmail] = useState("")
    const [joined, setJoined] = useState(() => localStorage.getItem(WAITLIST_KEY) !== null)

    const joinWaitlist = (event: React.FormEvent): void => {
        event.preventDefault()
        const trimmed = email.trim()
        if (!trimmed.includes("@")) {
            return
        }
        localStorage.setItem(WAITLIST_KEY, trimmed)
        setJoined(true)
    }

    // The last word of the headline gets the accent color.
    const words = product.headline.split(" ")
    const lead = words.slice(0, -1).join(" ")
    const lastWord = words[words.length - 1]

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <nav className={styles.nav}>
                    <span className={styles.logo}>
                        <span aria-hidden>{product.logoEmoji}</span>
                        {product.name}
                    </span>
                    <div className={styles.navLinks}>
                        <a className={styles.navLink} href="#features">
                            Features
                        </a>
                        <a className={styles.navLink} href="#pricing">
                            Pricing
                        </a>
                        <a className={styles.navLink} href="#faq">
                            FAQ
                        </a>
                    </div>
                    <a className={styles.navCta} href="#waitlist">
                        {product.waitlistCta}
                    </a>
                </nav>

                <header id="waitlist" className={styles.hero}>
                    <h1 className={styles.headline}>
                        {lead} <span className={styles.headlineAccent}>{lastWord}</span>
                    </h1>
                    <p className={styles.subheadline}>{product.subheadline}</p>

                    {joined ? (
                        <p className={styles.waitlistConfirm}>
                            You're on the list — watch your inbox for the next cohort.
                        </p>
                    ) : (
                        <form className={styles.waitlistForm} onSubmit={joinWaitlist}>
                            <input
                                type="email"
                                required
                                className={styles.waitlistInput}
                                placeholder={product.waitlistPlaceholder}
                                aria-label="Email address"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                            <button type="submit" className={styles.waitlistButton}>
                                {product.waitlistCta}
                            </button>
                        </form>
                    )}

                    {product.trustedBy.length > 0 ? (
                        <div className={styles.trustStrip} aria-label="Trusted by">
                            {product.trustedBy.map((company) => (
                                <span key={company}>{company}</span>
                            ))}
                        </div>
                    ) : null}
                </header>

                <section id="features" className={styles.section} aria-label="Features">
                    <span className={styles.sectionKicker}>Features</span>
                    <h2 className={styles.sectionTitle}>Everything your week is hiding</h2>
                    <div className={styles.featureGrid}>
                        {features.map((feature) => (
                            <article key={feature.title} className={styles.featureCard}>
                                <span className={styles.featureEmoji} aria-hidden>
                                    {feature.emoji}
                                </span>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDescription}>{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.section} aria-label="How it works">
                    <span className={styles.sectionKicker}>How it works</span>
                    <h2 className={styles.sectionTitle}>Three steps, one honest week</h2>
                    <div className={styles.stepsRow}>
                        {steps.map((step, index) => (
                            <article key={step.title} className={styles.stepCard}>
                                <span className={styles.stepNumber}>{index + 1}</span>
                                <h3 className={styles.featureTitle}>{step.title}</h3>
                                <p className={styles.featureDescription}>{step.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="pricing" className={styles.section} aria-label="Pricing">
                    <span className={styles.sectionKicker}>Pricing</span>
                    <h2 className={styles.sectionTitle}>Pay for the hours you get back</h2>

                    <div className={styles.billingToggle} role="group" aria-label="Billing period">
                        <button
                            type="button"
                            className={styles.billingOption}
                            aria-pressed={billing === "monthly"}
                            onClick={() => setBilling("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            className={styles.billingOption}
                            aria-pressed={billing === "yearly"}
                            onClick={() => setBilling("yearly")}
                        >
                            Yearly
                        </button>
                    </div>

                    <div className={styles.pricingGrid}>
                        {pricing.map((tier) => {
                            const price = billing === "monthly" ? tier.monthly : tier.yearlyPerMonth
                            return (
                                <article
                                    key={tier.name}
                                    className={styles.tierCard}
                                    data-highlighted={tier.highlighted === true}
                                >
                                    {tier.badge ? (
                                        <span className={styles.tierBadge}>{tier.badge}</span>
                                    ) : null}
                                    <h3 className={styles.tierName}>{tier.name}</h3>
                                    <div className={styles.tierPrice}>
                                        {price === 0 ? "Free" : `$${price}`}
                                        {price > 0 ? <span className={styles.tierPeriod}> /mo</span> : null}
                                    </div>
                                    <p className={styles.tierDescription}>{tier.description}</p>
                                    <ul className={styles.tierFeatures}>
                                        {tier.features.map((item) => (
                                            <li key={item} className={styles.tierFeatureItem}>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section id="faq" className={styles.section} aria-label="FAQ">
                    <span className={styles.sectionKicker}>FAQ</span>
                    <h2 className={styles.sectionTitle}>Fair questions</h2>
                    <div className={styles.faqList}>
                        {faq.map((item) => (
                            <details key={item.question} className={styles.faqItem}>
                                <summary className={styles.faqQuestion}>{item.question}</summary>
                                <p className={styles.faqAnswer}>{item.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className={styles.finalCta} aria-label="Join">
                    <h2 className={styles.sectionTitle}>See where your week really goes.</h2>
                    <a className={styles.navCta} href="#waitlist">
                        {product.waitlistCta}
                    </a>
                </section>

                <footer className={styles.footerBar}>
                    <span>{footer.blurb}</span>
                    {footer.links.map((link) => (
                        <a key={link.label} className={styles.footerLink} href={link.url}>
                            {link.label}
                        </a>
                    ))}
                    <span>· Made with LaunchBot</span>
                </footer>
            </div>
        </div>
    )
}
