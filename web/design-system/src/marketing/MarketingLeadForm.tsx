import React, { useState } from "react"
import * as styles from "./MarketingLeadForm.styles.css"

export type MarketingLeadFormVariant = "inline-email" | "contact-block" | "detail-form"

/** One input of the `detail-form` variant. */
export interface MarketingLeadFormField {
    /** Key in the submitted detail record, e.g. "name", "company". */
    name: string
    label: string
    /** Input treatment; exactly one field should be `email`. */
    type?: "text" | "email" | "tel" | "date" | "textarea" | "select"
    placeholder?: string
    required?: boolean
    /** Textareas and long inputs span both columns of the field grid. */
    fullWidth?: boolean
    /**
     * `select` only: the choices, verbatim. A required select submits its
     * first option by default (the browser's native behavior with no empty
     * sentinel); an optional one leads with an empty choice labeled by the
     * placeholder.
     */
    options?: string[]
}

/** name / email / company / message — the classic qualified-lead quartet. */
const DEFAULT_DETAIL_FIELDS: MarketingLeadFormField[] = [
    { name: "name", label: "Name", required: true },
    { name: "email", label: "Work email", type: "email", required: true },
    { name: "company", label: "Company", fullWidth: true },
    { name: "message", label: "What are you hoping to solve?", type: "textarea", fullWidth: true },
]

/** The email-capture trio shared by `inline-email` and the hero's `form-first`. */
export interface MarketingLeadCaptureContent {
    placeholder: string
    cta: string
    /** Shown in place of the form once `joined` is true. */
    confirmation: string
}

/** One way to reach you: mailto, tel, an address, or a social link. */
export interface MarketingContactChannel {
    /** e.g. "Email", "Phone", "Studio", "Instagram". */
    label: string
    /** Display text, e.g. "hello@studio.example" or "12 Harbor Rd". */
    value: string
    /** Link target (mailto:, tel:, https://); renders as plain text when omitted. */
    href?: string
}

/** Data-only content — persistence handlers are injected by the binder. */
export interface MarketingLeadFormContent extends Partial<MarketingLeadCaptureContent> {
    kicker?: string
    title?: string
    /** `contact-block` and `detail-form`: invitation copy above the form/channels. */
    body?: string
    /** The ways to reach you: `contact-block`'s body, `detail-form`'s trailer. */
    channels?: MarketingContactChannel[]
    /** `detail-form` only: the inputs; defaults to name/email/company/message. */
    fields?: MarketingLeadFormField[]
}

export interface MarketingLeadFormProps extends MarketingLeadFormContent {
    variant?: MarketingLeadFormVariant
    anchorId?: string
    joined: boolean
    /** `detail-form` passes the other fields alongside the email. */
    onSubmit: (email: string, details?: Record<string, string>) => void
}

/**
 * The email capture form shared by the lead-form section and the hero's
 * `form-first` variant. Purely presentational: where the email goes
 * (localStorage, a waitlist mutation) is the binder's decision.
 */
export function LeadCaptureFields({
    placeholder,
    cta,
    confirmation,
    joined,
    onSubmit,
}: MarketingLeadCaptureContent & Pick<MarketingLeadFormProps, "joined" | "onSubmit">): React.ReactElement {
    const [email, setEmail] = useState("")
    const [trap, setTrap] = useState("")

    if (joined) {
        return <p className={styles.confirmation}>{confirmation}</p>
    }

    const submit = (event: React.FormEvent): void => {
        event.preventDefault()
        const trimmed = email.trim()
        if (!trimmed.includes("@")) {
            return
        }
        // The trap value rides along only when a bot filled it; the managed
        // forms pipeline silently drops such submissions server-side.
        onSubmit(trimmed, trap !== "" ? { [HONEYPOT_FIELD]: trap } : undefined)
    }

    return (
        <form className={styles.form} onSubmit={submit}>
            <HoneypotInput value={trap} onChange={setTrap} />
            <input
                type="email"
                required
                className={styles.input}
                placeholder={placeholder}
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className={styles.button}>
                {cta}
            </button>
        </form>
    )
}

/**
 * The honeypot field name the managed forms pipeline drops on sight (must
 * match the platform's FORMS_HONEYPOT_FIELD). Underscore-prefixed fields are
 * machinery: the platform never shows them to the site owner.
 */
const HONEYPOT_FIELD = "_trap"

/**
 * A visually hidden text input humans never see or reach (off-screen,
 * untabbable, hidden from assistive tech) but naive form-filling bots
 * complete. A non-empty value marks the submission as spam server-side.
 */
function HoneypotInput({
    value,
    onChange,
}: {
    value: string
    onChange: (value: string) => void
}): React.ReactElement {
    return (
        <input
            type="text"
            name={HONEYPOT_FIELD}
            className={styles.trap}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    )
}

/** The qualified-lead card: labeled fields on a bordered surface. */
function DetailFormFields({
    fields,
    cta,
    confirmation,
    joined,
    onSubmit,
}: {
    fields: MarketingLeadFormField[]
    cta: string
    confirmation: string
    joined: boolean
    onSubmit: MarketingLeadFormProps["onSubmit"]
}): React.ReactElement {
    const [values, setValues] = useState<Record<string, string>>({})
    const [trap, setTrap] = useState("")

    if (joined) {
        return <p className={styles.confirmation}>{confirmation}</p>
    }

    const emailField = fields.find((field) => field.type === "email") ?? fields[0]

    const submit = (event: React.FormEvent): void => {
        event.preventDefault()
        const email = (values[emailField?.name ?? "email"] ?? "").trim()
        if (!email.includes("@")) {
            return
        }
        const details: Record<string, string> = {}
        for (const field of fields) {
            // An untouched required select is showing its first option —
            // submit what the guest sees, not the untouched empty state.
            const untouched =
                field.type === "select" && field.required === true ? (field.options?.[0] ?? "") : ""
            const value = (values[field.name] ?? untouched).trim()
            if (value !== "") {
                details[field.name] = value
            }
        }
        if (trap !== "") {
            details[HONEYPOT_FIELD] = trap
        }
        onSubmit(email, details)
    }

    const setValue = (name: string, value: string): void =>
        setValues((current) => ({ ...current, [name]: value }))

    return (
        <form className={styles.detailForm} onSubmit={submit}>
            <HoneypotInput value={trap} onChange={setTrap} />
            {fields.map((field) => {
                const fullWidth = field.fullWidth === true || field.type === "textarea"
                const fieldClass = fullWidth
                    ? `${styles.detailField} ${styles.detailFieldFull}`
                    : styles.detailField
                const id = `lead-${field.name}`
                return (
                    <div key={field.name} className={fieldClass}>
                        <label className={styles.detailLabel} htmlFor={id}>
                            {field.label}
                        </label>
                        {field.type === "textarea" ? (
                            <textarea
                                id={id}
                                className={styles.detailTextarea}
                                placeholder={field.placeholder}
                                required={field.required}
                                value={values[field.name] ?? ""}
                                onChange={(event) => setValue(field.name, event.target.value)}
                            />
                        ) : field.type === "select" ? (
                            <select
                                id={id}
                                className={styles.detailSelect}
                                required={field.required}
                                value={
                                    values[field.name] ?? (field.required ? (field.options?.[0] ?? "") : "")
                                }
                                onChange={(event) => setValue(field.name, event.target.value)}
                            >
                                {field.required !== true && (
                                    <option value="">{field.placeholder ?? "—"}</option>
                                )}
                                {(field.options ?? []).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={id}
                                type={field.type ?? "text"}
                                className={styles.detailInput}
                                placeholder={field.placeholder}
                                required={field.required}
                                value={values[field.name] ?? ""}
                                onChange={(event) => setValue(field.name, event.target.value)}
                            />
                        )}
                    </div>
                )
            })}
            <div className={styles.detailSubmitRow}>
                <button type="submit" className={styles.button}>
                    {cta}
                </button>
            </div>
        </form>
    )
}

/**
 * Direct-contact channels: `contact-block`'s whole body, and an optional
 * trailer under `detail-form` (channels without an href render as plain
 * selectable text — for showing an email address without a mailto link,
 * which would open a local mail app most visitors don't use).
 */
function ContactChannels({
    channels,
    className = styles.channels,
}: {
    channels: MarketingContactChannel[]
    className?: string
}): React.ReactElement {
    return (
        <div className={className}>
            {channels.map((channel) => (
                <div key={channel.label} className={styles.channel}>
                    <span className={styles.channelLabel}>{channel.label}</span>
                    {channel.href !== undefined ? (
                        <a className={styles.channelLink} href={channel.href}>
                            {channel.value}
                        </a>
                    ) : (
                        <span className={styles.channelValue}>{channel.value}</span>
                    )}
                </div>
            ))}
        </div>
    )
}

/**
 * Intent-capture section. `inline-email` is the single-input waitlist form;
 * `contact-block` swaps the form for direct channels (mailto/phone/address/
 * socials) — the local-business and portfolio pattern; `detail-form` is the
 * qualified-lead card (name/email/company/message by default, `fields`
 * overrides) for agencies, studios, and sales-led products.
 */
export function MarketingLeadForm({
    variant = "inline-email",
    anchorId,
    kicker,
    title,
    placeholder,
    cta,
    confirmation,
    body,
    channels,
    fields,
    joined,
    onSubmit,
}: MarketingLeadFormProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? cta ?? "Contact"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {variant === "detail-form" ? (
                <>
                    {body !== undefined ? <p className={styles.body}>{body}</p> : null}
                    <DetailFormFields
                        fields={fields ?? DEFAULT_DETAIL_FIELDS}
                        cta={cta ?? "Send message"}
                        confirmation={confirmation ?? "Thanks — we'll be in touch shortly."}
                        joined={joined}
                        onSubmit={onSubmit}
                    />
                    {channels !== undefined && channels.length > 0 ? (
                        <ContactChannels channels={channels} className={styles.channelsTrailer} />
                    ) : null}
                </>
            ) : variant === "contact-block" ? (
                <>
                    {body !== undefined ? <p className={styles.body}>{body}</p> : null}
                    <ContactChannels channels={channels ?? []} />
                </>
            ) : placeholder !== undefined && cta !== undefined && confirmation !== undefined ? (
                <LeadCaptureFields
                    placeholder={placeholder}
                    cta={cta}
                    confirmation={confirmation}
                    joined={joined}
                    onSubmit={onSubmit}
                />
            ) : null}
        </section>
    )
}
