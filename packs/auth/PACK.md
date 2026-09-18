# Pack: auth

Full-stack vertical pack: user accounts on the kernel's Identity domain — sign-up, sign-in, and session-aware pages, with the login page as the home surface.

## What ships

- The kernel Identity domain end-to-end: `LoginPage`, `currentUser` hydration, protected routes, and the Users exemplar page
- `/` redirects to `/login` when this pack is active; signed-in users land on the exemplar app
- Dedicated routes for every auth flow — `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/magic-link` — all entry points into one surface, so marketing CTAs and emails can deep-link straight to the right step (with `?email=` prefill); in-flow transitions keep the URL truthful without losing form state
- One designed sign-in experience in every mode: the design system's `AuthShell` split layout (branded welcome panel + card) around `AuthCard` (see `docs/auth.md`), shipped in light mode (`repobot.theme.json` `mode` is stamped from this pack's catalog at compose time). Enabled methods are config — `VITE_AUTH_METHODS` picks from email codes, password, Google, Apple, and guest sign-in, defaulting to the email → 6-digit-code flow
- In the workspace, auth runs `AUTH_MODE=local`: the same surface, but every method is simulated — no email is sent, any 6-digit code signs in as the dev user, and a footnote link skips straight in ("Skip as local dev user")
- On deploy, `AUTH_MODE=builtin` runs the kernel's own auth service: real OTP emails via the platform-provided SMTP account, HS256 JWTs signed with the provisioner-generated `AUTH_JWT_SECRET` (see `docs/environments-and-secrets.md`)

Set [`../active.json`](../active.json) to `{ "key": "auth" }` to make this pack the home surface.

## Agent recipe: build on accounts

1. Add domain data owned by a user by following `docs/adding-a-domain.md`; scope queries by the authenticated principal (see `docs/authorization.md`).
2. Pick sign-in methods with `VITE_AUTH_METHODS` (ordered, comma-separated). Restyle the surface in `web/design-system/src/components/AuthShell.tsx` / `AuthCard.tsx` and iterate in Storybook (`npm run storybook`) — the app's `LoginPage` wrapper in `web/app/src/View/LoginPage/` only wires handlers and owns the welcome-panel copy (`PANEL_COPY`), which the content pass should rewrite for the product.
3. Email flows (sign-up confirmation links, password reset) are handled by the kernel's built-in auth service and only active on deployed environments. OAuth (`google`, `apple`) requires the matching sign-in provider to be enabled and configured in the project's platform settings (Google is one click; Apple needs the owner's Apple Developer credentials).
4. Customize the emails themselves (subjects, HTML) by editing the root `repobot.emails.json` — applied on the next deploy (dashboard-saved templates apply live and win per email type). See `docs/auth-emails.md` for the contract and required variables. For logos/images: save the asset in `web/app/public/` and reference it as `{{ .SiteURL }}/logo.png` — never base64 or relative paths.

## Non-goals for this pack

- Real email delivery in the workspace (the code step is simulated by design; deploy to exercise the real flows)
- OAuth provider _setup_ (the buttons render when enabled, but Google credentials come from the platform's Google Sign-In integration and Apple credentials from the platform's Apple Sign-In provider settings after first deploy)
