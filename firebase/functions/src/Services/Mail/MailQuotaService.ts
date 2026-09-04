import { eq, sql } from "drizzle-orm"
import { mailSendCountersTable } from "../../Data/Mail/MailSendCounter.js"
import { mailDb } from "../../Data/MailDatabase.js"
import { validatedEnv } from "../../Utils/Env.js"

/**
 * Which slice of the quota a send draws from. "template" is the mail
 * kernel's sendTemplatedMail; "auth" is the built-in auth emails (sign-in
 * codes, confirmations, recovery). Both count into the same daily counter —
 * they share the platform SMTP account — but auth mail is allowed up to
 * TWICE the quota, so a template-mail flood can never lock users out of
 * sign-in (see docs/mail.md).
 */
export type MailSendCategory = "template" | "auth"

/** The per-day cap applied when MAIL_DAILY_QUOTA is unset, empty, or "0". */
export const DEFAULT_MAIL_DAILY_QUOTA = 200

/** Auth mail keeps sending until the shared counter reaches this multiple. */
const AUTH_QUOTA_MULTIPLIER = 2

/**
 * Resolves MAIL_DAILY_QUOTA to the effective daily cap for template mail.
 * Unset, empty, or "0" means the kernel default (200/day); a negative value
 * means unlimited (returned as Infinity). The platform stages the actual
 * value per environment.
 */
export function resolveMailDailyQuota(): number {
    const raw = (validatedEnv().MAIL_DAILY_QUOTA ?? "").trim()
    if (raw === "") {
        return DEFAULT_MAIL_DAILY_QUOTA
    }
    const parsed = Number.parseInt(raw, 10)
    if (parsed === 0) {
        return DEFAULT_MAIL_DAILY_QUOTA
    }
    return parsed < 0 ? Number.POSITIVE_INFINITY : parsed
}

/**
 * The daily send quota over the shared SMTP account (docs/mail.md). Both
 * transport callers — mailService.sendTemplatedMail and the auth kernel's
 * sendCode — reserve a slot here before handing a message to MailWrapper.
 *
 * The check is count-then-increment against one mail_send_counters row per
 * UTC day: concurrent sends racing the read can overshoot the cap by a few
 * messages, which is an accepted trade for not holding locks in the send
 * path. Never throws into domain code — a refused reservation reports false
 * and callers keep the mail kernel's degrade posture.
 */
class MailQuotaService {
    /** First-refusal-of-the-day log guard, per category (per process instance). */
    private warnedDayByCategory = new Map<MailSendCategory, string>()

    /**
     * Counts today's sends against the category's limit and, when under it,
     * records the send and reports true. Beyond the limit reports false; the
     * exhaustion warning logs once per category per UTC day, not per send.
     */
    async tryReserveSend(category: MailSendCategory, now = new Date()): Promise<boolean> {
        const limit = limitFor(category)
        if (limit === Number.POSITIVE_INFINITY) {
            return true
        }
        const day = utcDayFor(now)
        if ((await this.sentCountFor(day)) >= limit) {
            this.warnOnFirstExhaustion(category, day, limit)
            return false
        }
        await mailDb
            .insert(mailSendCountersTable)
            .values({ day, sentCount: 1 })
            .onConflictDoUpdate({
                target: mailSendCountersTable.day,
                set: { sentCount: sql`${mailSendCountersTable.sentCount} + 1` },
            })
        return true
    }

    /**
     * Template-mail sends left today (the primary quota, not the auth
     * carve-out); Infinity when the quota is unlimited. A dashboard read.
     */
    async remainingToday(now = new Date()): Promise<number> {
        const limit = limitFor("template")
        if (limit === Number.POSITIVE_INFINITY) {
            return Number.POSITIVE_INFINITY
        }
        return Math.max(0, limit - (await this.sentCountFor(utcDayFor(now))))
    }

    /** True when template mail is out of quota for the current UTC day. */
    async isQuotaExhausted(now = new Date()): Promise<boolean> {
        return (await this.remainingToday(now)) === 0
    }

    private async sentCountFor(day: string): Promise<number> {
        const [row] = await mailDb
            .select({ sentCount: mailSendCountersTable.sentCount })
            .from(mailSendCountersTable)
            .where(eq(mailSendCountersTable.day, day))
        return row?.sentCount ?? 0
    }

    private warnOnFirstExhaustion(category: MailSendCategory, day: string, limit: number): void {
        if (this.warnedDayByCategory.get(category) === day) {
            return
        }
        this.warnedDayByCategory.set(category, day)
        console.warn(
            `[Mail] daily send quota exhausted for ${category} mail: ${limit} sends reached ` +
                `on ${day} (UTC). Further ${category} sends today are dropped. ` +
                `MAIL_DAILY_QUOTA raises the cap; a verified sender domain removes it (docs/mail.md).`,
        )
    }
}

/**
 * Template mail stops at the quota; auth mail keeps sending until the shared
 * counter reaches twice the quota. One counter, two thresholds — chosen over
 * a separate auth ledger because it is the simplest rule that guarantees a
 * template flood always leaves at least a full quota's worth of headroom for
 * sign-in email.
 */
function limitFor(category: MailSendCategory): number {
    const quota = resolveMailDailyQuota()
    return category === "auth" ? quota * AUTH_QUOTA_MULTIPLIER : quota
}

function utcDayFor(at: Date): string {
    return at.toISOString().slice(0, 10)
}

export const mailQuotaService = new MailQuotaService()
