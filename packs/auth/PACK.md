# Pack: auth

Full-stack vertical pack: user accounts on the kernel's Identity domain — sign-up, sign-in, and session-aware pages, with the login page as the home surface.

## What ships

- The kernel Identity domain end-to-end: `LoginPage`, `currentUser` hydration, protected routes, and the Users exemplar page
- `/` redirects to `/login` when this pack is active; signed-in users land on the exemplar app
- One designed sign-in experience in every mode: the design system's `AuthCard` (see `docs/auth.md`), a branded dark card whose enabled methods are config — `VITE_AUTH_METHODS` picks from email codes, password, Google, and guest sign-in, defaulting to the email → 6-digit-code flow
- In the sandbox, auth runs `AUTH_MODE=local`: the same surface, but every method is simulated — no email is sent, any 6-digit code signs in as the dev user, and a footnote link skips straight in ("Skip as local dev user")
- On deploy, `AUTH_MODE=builtin` runs the kernel's own auth service: real OTP emails via the platform-provided SMTP account, HS256 JWTs signed with the provisioner-generated `AUTH_JWT_SECRET` (see `docs/environments-and-secrets.md`)

Set [`../active.json`](../active.json) to `{ "key": "auth" }` to make this pack the home surface.

## Agent recipe: build on accounts

1. Add domain data owned by a user by following `docs/adding-a-domain.md`; scope queries by the authenticated principal (see `docs/authorization.md`).
2. Pick sign-in methods with `VITE_AUTH_METHODS` (ordered, comma-separated). Restyle the surface in `web/design-system/src/components/AuthCard.tsx` and iterate in Storybook (`npm run storybook`) — the app's `LoginPage` wrapper in `web/app/src/View/LoginPage/` only wires handlers.
3. Email flows (sign-up codes, password reset) are handled by the kernel's built-in auth service and only active on deployed environments. OAuth (`google`) requires the account's Google Sign-In integration to be connected on the platform.
4. Customize the emails themselves (subjects, HTML) by editing the root `repobot.emails.json` — applied on the next deploy. See `docs/auth-emails.md` for the contract and required variables. For logos/images: save the asset in `web/app/public/` and reference it as `{{ .SiteURL }}/logo.png` — never base64 or relative paths.

## Non-goals for this pack

- Real email delivery in the sandbox (the code step is simulated by design; deploy to exercise the real flows)
- OAuth provider _setup_ (the button renders when enabled, but the Google OAuth credentials come from the platform's Google Sign-In integration after first deploy)
