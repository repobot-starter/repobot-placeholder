# Mail

The mail kernel: transactional email as **template key + variables**, sent
over the shared SMTP transport. Domains that need to email someone compose
this service — the payments receipt is the exemplar — and never touch SMTP,
inline HTML at the call site, or fork delivery plumbing.

## The shape of the kernel

| Piece             | Where                                                  | What it is                                                                |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Service           | `firebase/functions/src/Services/Mail/MailService.ts`  | `sendTemplatedMail({ toEmail, templateKey, variables })`                  |
| Templates         | `Services/Mail/MailTemplates.ts`                       | The registry: subject + html with `{{variable}}` placeholders             |
| Transport         | `DependencyWrappers/MailWrapper`                       | Real SMTP when deployed; an in-memory fake in tests/emulator              |
| Quota             | `Services/Mail/MailQuotaService.ts`                    | The daily send cap both transport callers reserve against (see below)     |
| Consumer exemplar | `Services/Payments/PaymentsService.ts` (`sendReceipt`) | One receipt per ledgered purchase, gated by the exactly-once ledger write |

**Transactional email is never hand-built.** A new email is a new entry in
`mailTemplates` plus a `sendTemplatedMail` call — not new rendering, new
transport code, or ad-hoc HTML strings in a service.

## Rendering rules

- Templates use `{{variable}}` placeholders in both subject and html.
- Variable values are **HTML-escaped** at render time, so user- or
  provider-supplied strings (product names, references) can never inject
  markup.
- A missing variable throws `INTERNAL` — a broken template is a programming
  error caught in tests, never a half-rendered email in an inbox.

## Modes and degraded behavior

The mode split follows the transport, not a `MAIL_MODE` variable:

- **Tests and the emulator** — `FakeMailWrapper` records messages in memory
  (and logs them under the emulator) instead of delivering. Assert with
  `setMailWrapperForTests(new FakeMailWrapper())` and `lastMessageTo(...)`.
- **Deployed with the `EMAIL` capability** — the platform provisions the
  SMTP account (`SMTP_HOST` etc., see `env.manifest.json`) and mail actually
  sends.
- **Deployed without it** — `sendTemplatedMail` degrades to a log line and
  returns `false`. Transactional mail is **best-effort by design**: a send
  failure must never fail the flow it rides on (see the receipt's try/catch
  in `PaymentsService`).

## The daily send quota

Standalone EMAIL means arbitrary app-authored sending on the **shared
platform SMTP account**, where one spammy deploy damages deliverability for
every customer on the default sender. The guardrail is a per-project daily
quota, enforced at the shared transport layer: both callers of `MailWrapper`
— `mailService.sendTemplatedMail` and the auth kernel's code emails —
reserve a slot in `MailQuotaService` before handing a message to the
transport.

- **The limit** comes from `MAIL_DAILY_QUOTA` (staged per environment by the
  platform; see `env.manifest.json`). Unset, empty, or `0` means the kernel
  default of **200 sends per day**; a **negative value means unlimited** —
  the posture for projects that moved to their own verified sender domain
  and reputation.
- **Counting** is per UTC calendar day in the `mail_send_counters` table:
  one row per day, template and auth mail incrementing the same counter
  (they share the SMTP account, so they share the quota). The check is
  count-then-send with no locking, so **concurrent sends racing the read can
  overshoot the cap by a few messages** — an accepted trade for a lock-free
  send path.
- **At the limit** template sends keep the kernel's degrade posture: a
  refused send returns `false` and never throws into domain code, exactly
  like a deploy with no SMTP. The exhaustion warning logs **once per
  category per UTC day** (per process instance), not per send.
- **The auth carve-out**: auth mail (sign-in codes, confirmations, recovery)
  keeps sending until the shared counter reaches **twice the quota**. One
  counter, two thresholds — the simplest rule that guarantees a
  template-mail flood always leaves at least a full quota's worth of
  headroom for sign-in email. When even the 2x ceiling is hit, auth
  surfaces `RESOURCE_EXHAUSTED` instead of degrading silently (claiming a
  code was sent when it wasn't would strand the user).
- **Observability**: `mailQuotaService.remainingToday()` /
  `isQuotaExhausted()` are the reads a dashboard can surface; they report
  the template-mail quota (`remainingToday` is `Infinity` when unlimited).

## The sender identity (branded sending domains)

Every send goes out as `SMTP_SENDER_NAME <SMTP_SENDER_EMAIL>` — the kernel
never hardcodes a From address. Both values are platform-injected: by
default they point at the platform's shared sending address displaying the
app's own name, and when the app's owner verifies their own domain on the
platform dashboard (Domains page: DKIM/SPF records, checked by the
platform's email provider) the platform re-stages them as
`{name}@{their-domain}`, effective on the environment's next deploy.

DKIM signing happens **provider-side at the platform's SMTP relay** for
verified domains — this repo holds no keys and does no signing, which is
why there is no signing hook in `MailWrapper`. Auth emails additionally
pick up a sender change live (the `AUTH_EMAIL_CONFIG_SECRET` path in
`Services/Identity/BuiltinAuth/LiveAuthEmailConfig.ts`); the mail kernel
reads only the deploy-time env, so its sends adopt a new sender at the
next deploy.

## The auth exception

Built-in auth emails (sign-in codes, confirmations, recovery) predate this
kernel and keep the platform's `repobot.emails.json` contract — Go-template
variables and live-config overrides, in
`Services/Identity/BuiltinAuth/AuthEmailTemplates.ts`. They share the
`MailWrapper` transport (and therefore the daily send quota, with the
carve-out above) but not the template registry. Don't migrate them; don't
model new emails on them either.

## Growing it

- **A new email** (booking confirmation, welcome note): add a template to
  `mailTemplates`, call `sendTemplatedMail` from the owning domain's service,
  and test it through `FakeMailWrapper`.
- **Recipient addresses come from real flows** — the payments kernel records
  the buyer's email on the `purchases` ledger from Stripe Checkout; auth
  knows the account email. Never collect an email client-side just to mail it
  server-side without a domain reason.
- **Digests/scheduled mail** would add a scheduler, not change this kernel's
  contract: still template key + variables in, one send out.
