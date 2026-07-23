# Auth emails

The sign-in, sign-up, and password-reset emails your deployed app sends are
customizable from this repo. The root file `repobot.emails.json` is the
contract: the platform reads it after every successful deploy and injects it
into the environment's auth service configuration (`AUTH_EMAIL_TEMPLATES`).
Edit the file like any code — templates version with the repo and land with
the next deploy.

## The contract file

`repobot.emails.json` has three optional sections, one per email type:

```json
{
    "magicLink": { "subject": "...", "html": "..." },
    "confirmation": { "subject": "...", "html": "..." },
    "recovery": { "subject": "...", "html": "..." }
}
```

| Section        | Sent when...                               |
| -------------- | ------------------------------------------ |
| `magicLink`    | An existing user signs in with their email |
| `confirmation` | A new user signs up and must confirm       |
| `recovery`     | A user asks to reset their password        |

Sections you omit keep their current templates. The file in this repo ships
the platform defaults, so start by editing what's here rather than writing a
format from scratch.

## Required variables

Each `html` body **must** include at least one of:

- `{{ .Token }}` — the 6-digit code the user types into the app
- `{{ .ConfirmationURL }}` — the clickable sign-in/confirmation link

Without one of these, the email carries no way to sign in, so the platform
rejects the file (and keeps the previous templates). The login flow in this
repo is built around typing the code, so keep `{{ .Token }}` prominent.

## Images and logos

To show a logo (or any image) in an email, serve it from the deployed site
and reference it with `{{ .SiteURL }}`:

1. Put the asset (e.g. `logo.png`) in `web/app/public/` so it deploys with
   the site. If the user uploaded a logo, save it there.
2. Reference it in the template as an absolute URL:

```html
<img src="{{ .SiteURL }}/logo.png" alt="Acme" width="120" />
```

`{{ .SiteURL }}` resolves to the environment's live URL — and switches to
the customer's custom domain automatically when one becomes active — so the
image keeps working across deploys and domains.

Do **not**:

- Inline images as base64 `data:` URIs — Gmail and Outlook block them, and
  they blow past the 64 KiB body cap, which silently keeps the old template.
- Use relative paths (`src="/logo.png"`) — email clients have no base URL to
  resolve them against, so the image never loads.

Email-client HTML is limited in general: use inline `style` attributes
(many clients strip `<style>` blocks) and simple markup, as in the defaults.

## Validation rules

- `subject`: 1–200 characters
- `html`: non-empty, at most 64 KiB, must contain a required variable
- No unknown top-level keys

An invalid file never fails a deploy: the deploy lands, the previous
templates stay in effect, and the rejection is recorded in the
organization's audit log (`email_templates.rejected`).

## When it applies

- **Deploy time only.** The platform applies the file at the deployed branch
  after each successful deploy. There is no live sync while editing.
- **Sandbox never sends email.** In the workspace sandbox, auth runs in
  local mode and the code step is simulated — deploy to see real emails.
- **Client-only projects** have no auth backend, so the file is inert there.

## Sending from your own domain

By default, auth emails come from the platform's shared sender address. Org
admins can verify their own domain (DKIM/SPF) on the dashboard's Domains
page, after which this environment's auth emails send from
`auth@yourdomain.com`. That is a dashboard/platform concern — nothing in
this repo changes.
