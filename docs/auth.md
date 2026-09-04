# Auth

Auth is a modular kernel component with three layers. Understanding the split
is what lets you restyle the login surface, add a sign-in method, or reuse
auth in a new template without touching the other layers.

| Layer   | Where                                                             | What it owns                                                                                                                                                                                                  |
| ------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface | `web/design-system/src/components/AuthCard.tsx` + `AuthShell.tsx` | The sign-in UI: the card's method rendering and view states (code entry, reset, sign-up), plus the split-layout screen (branded welcome panel + content pane). Purely presentational — handlers are injected. |
| Client  | `web/core/src/Auth/`                                              | The `AuthClient` interface and the two implementations: `BuiltinAuthClient` (deployed) and `LocalAuthClient` (sandbox dev JWT).                                                                               |
| Backend | `firebase/functions/src/Services/Identity/`                       | Token verification (`TokenVerifier`), the built-in auth service (`BuiltinAuth/`, exposed as `auth__request__api`), and user/account linking.                                                                  |

The iOS (`ios/App/Auth/`, `ios/App/View/SignIn/`) and Android
(`android/.../auth/`, `.../view/signin/`) apps mirror the client + surface
layers natively.

## Sign-in methods are config, not code

The method registry lives in `web/core/src/Auth/AuthMethods.ts`. Deployments
choose methods with the `VITE_AUTH_METHODS` env value (`AUTH_METHODS` on
native): a comma-separated, ordered list of:

| Method       | Notes                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email-code` | Default. Email OTP with a magic-link fallback. Works on every provisioned project with zero setup.                                                                                                        |
| `password`   | Email + password. Sign-up confirms the email via an emailed verify-link button (clicking it signs the user in); password reset is code-based.                                                             |
| `google`     | OAuth redirect flow. Requires a Google OAuth client (`GOOGLE_SIGNIN_CLIENT_ID`/`SECRET`, injected from the platform's Google Sign-In integration).                                                        |
| `apple`      | Sign in with Apple. Redirect flow on web/Android; native `ASAuthorizationController` sheet on iOS. Requires the Apple credentials in `APPLE_SIGNIN_*` (provisioned via the platform's provider settings). |
| `github`     | OAuth redirect flow. Requires a GitHub OAuth app (`GITHUB_SIGNIN_CLIENT_ID`/`SECRET`). The primary verified email is read from the emails endpoint.                                                       |
| `facebook`   | OAuth redirect flow. Requires a Facebook app (`FACEBOOK_SIGNIN_CLIENT_ID`/`SECRET`). Sign-in fails cleanly if the user withholds their email.                                                             |
| `discord`    | OAuth redirect flow. Requires a Discord application (`DISCORD_SIGNIN_CLIENT_ID`/`SECRET`).                                                                                                                |
| `x`          | OAuth redirect flow with PKCE. Requires an X app (`X_SIGNIN_CLIENT_ID`/`SECRET`) with "Request email from users" enabled so the confirmed email is readable.                                              |
| `linkedin`   | OIDC redirect flow. Requires a LinkedIn app (`LINKEDIN_SIGNIN_CLIENT_ID`/`SECRET`) with the "Sign In with LinkedIn using OpenID Connect" product.                                                         |
| `anonymous`  | "Continue as guest". Guests are keyed by a synthetic `guest-<sub>@anonymous.invalid` email (see `GuestIdentity.ts`).                                                                                      |

The list's order is the render order of the sign-in surface. All three
platforms parse the value with identical semantics — the parity contract is
pinned by `web/app/tests/Auth/AuthMethods.test.ts`,
`ios/AppTests/AuthMethodsTests.swift`, and
`android/app/src/test/.../AuthMethodsTest.kt`.

The env value is the deploy-time baseline; methods can also be live-toggled
without a redeploy. The platform writes the enabled list into the
per-environment auth-config secret (the same live secret that carries email
templates — `LiveAuthConfig.ts`, see `docs/auth-emails.md`), the auth API
serves it at `GET /config`, and every login surface fetches it on mount via
`authClient.fetchRuntimeAuthMethods()`, keeping the build-time list as the
render-immediately fallback. The sandbox is no exception: its auth API reads
the same payload from a platform-written file (`AUTH_CONFIG_FILE`, see
`LiveAuthConfig.ts`), and the local auth client fetches `GET /config` like
the builtin one — a dashboard toggle shows up in an open preview within the
same ~minute it reaches deploys. The endpoint returns `methods: null` until a
project first live-toggles, so untouched projects behave exactly as before.

## OAuth providers: one registry, one seam

OAuth providers live in a single backend registry,
`firebase/functions/src/Services/Identity/BuiltinAuth/OAuthProviders.ts`.
Each provider is a definition object — `isConfigured`, `buildAuthorizeUrl`,
`exchangeCode` returning a normalized `{ subject, email, emailVerified,
displayName }` profile — and everything downstream is generic:

- The auth API (`CloudFunctions/Auth.ts`) exposes `GET /:provider/start` and
  a callback per registered provider. `BuiltinAuthService.signInWithOAuthProfile`
  finds-or-creates the user and links the provider subject onto
  `auth_identities` (one nullable `<provider>_subject` column per provider,
  unique-indexed).
- The web client (`BuiltinAuthClient.signInWithOAuth`) just navigates to
  `/:provider/start` — adding a provider requires no web client change beyond
  the `AuthMethods.ts` registry entry.
- Existing accounts link automatically by verified email: signing in with
  Apple using the same address as a Google/email account attaches the new
  subject to the existing identity rather than creating a duplicate user.

Standard providers (GitHub, Facebook, Discord, X, LinkedIn) are built by the
`standardOAuth2Provider` factory in `OAuthProviders.ts`: a config object
(authorize/token URLs, scope, env prefix, and either an OIDC id_token or a
profile-endpoint fetch) produces the whole definition. X's mandatory PKCE is
absorbed there too — the code_verifier is derived from the signed state JWT,
so no server-side flow state is needed.

Apple has two extra wrinkles the registry absorbs: its client secret is a
short-lived ES256 JWT minted from the team's private key
(`mintAppleClientSecret`), and its authorize flow POSTs the callback
(`response_mode=form_post`), so the Apple callback is a POST route. On iOS
the native sheet skips the redirect entirely: the app posts the
`ASAuthorizationController` identity token to `POST /apple/native`, which
verifies it against Apple's JWKS and issues the same session tokens.

### The platform callback proxy (`AUTH_OAUTH_PROXY_URL`)

Providers require every redirect URI to be whitelisted in the OAuth app,
and an environment's own callback URL changes as environments come and go.
When `AUTH_OAUTH_PROXY_URL` is set (the platform injects it for deployed
environments), the redirect_uri handed to providers — at authorize time and
again at code exchange, where they must match — is the platform's stable
proxy (`{proxy}/{provider}/callback`) instead of this environment's
`AUTH_PUBLIC_URL`. The start route then adds an `origin` claim (this
environment's auth origin) to the state JWT; the proxy reads it without
verifying the signature — it can't, the secret is per-environment — and
forwards the callback here after checking the origin against its allowlist
of provisioned environments. The signature is verified here as always, so a
tampered origin either fails the proxy's allowlist or lands on an
environment whose secret rejects it. X's PKCE survives the hop because the
code_verifier is derived from the state string, which the proxy forwards
untouched. Without the env var, nothing changes: providers redirect
straight to `AUTH_PUBLIC_URL` and each environment's URL must be
whitelisted individually.

In the sandbox (`AUTH_MODE=local`) every provider button simulates —
clicking it signs in as the local dev user, no credentials needed — so the
surface is fully exercisable before any provider is configured.

To add another provider: add its key to `AuthMethods.ts` (web) and the
native `AuthMethod` enums, add a `standardOAuth2Provider` config to
`OAuthProviders.ts` (a bespoke definition only if its flow is irregular),
add a `<provider>_subject` column migration (mirrored in `AuthIdentity.ts`),
map it in `oauthSubjectFields`, declare its env vars in `env.manifest.json`,
and give the platform a provisioning path for its credentials. The label
maps in `AuthCard.tsx` and the native sign-in views grow one entry; no other
surface or client code changes.

## Iterating on the login surface (no deploy needed)

`AuthCard` is a design-system component with full Storybook coverage
(`AuthCard.stories.tsx`): every method combination, the code-entry / reset /
sign-up views, error states, sandbox mode, and a custom-brand example run
against mock handlers. To tune styling:

```
npm run storybook   # from the repo root
```

Edit `AuthCard.styles.css.ts` (theme tokens only) and watch every state
update live. The app's `LoginPage` is a thin wrapper that binds the card to
the runtime's auth client, so Storybook is pixel-identical to the product.

The sandbox login page renders the _same_ configured methods as deploys —
every action simulates by signing in as the local dev user — so what you
build against locally is what ships.

## Dedicated auth routes

Every flow has its own URL, so marketing CTAs and transactional emails can
deep-link straight to the right step:

| Route              | Card view      | Typical entry point                          |
| ------------------ | -------------- | -------------------------------------------- |
| `/login`           | `start`        | "Sign in" CTA                                |
| `/signup`          | `signup`       | "Get started" / "Create account" CTA         |
| `/forgot-password` | `reset`        | "Forgot password?" links                     |
| `/reset-password`  | `reset-verify` | Password-recovery emails (`?email=` prefill) |
| `/magic-link`      | `code`         | Sign-in code emails (`?email=` prefill)      |

All five render the same `LoginPage` surface: the pathname picks the card's
starting view and `?email=` pre-fills the address. In-card transitions keep
the URL truthful with `history.replaceState` (via `AuthCard`'s
`onViewChange`) without remounting, so form state and status messages
survive the flow.

## The account settings destination

The signed-in exemplar ships a `/settings` destination inside the protected
shell (`web/app/src/View/Settings/SettingsPage.tsx`, mirrored natively by the
`SettingsView` twins in `ios/App/View/Settings/` and
`android/.../view/settings/`; the shell's profile menu links to it — see
`docs/shell.md`). It owns:

- **Profile editing** through the existing backend-driven user update
  SchemaForm (`userUpdateFormSchema` + `updateUser` — the same machinery the
  Users page uses; nothing is hand-built). Native settings edit the display
  name through the shared `updateUser` mutation via the platform
  `UserComponent`.
- **Auth identity, read-only** — the signed-in email and auth mode come from
  `currentUser` and the environment; the settings page never mutates them.
- **Password change** — web only, and only when the deployment runs builtin
  auth with the `password` method enabled. It calls the existing
  `auth__request__api` `POST /password` endpoint (the same
  `BuiltinAuthService.updatePassword` path the recovery flow uses) through
  `authClient.updatePassword(newPassword)`. In local (sandbox) auth mode
  there is no password to manage, so the section is hidden.
- **Sign out** via `runtime.authClient.signOut()` (`AuthComponent.signOut`
  natively).

## Reusing auth in a new template

A template that needs auth renders `AuthShell` + `AuthCard` (or the simpler
centered `AuthScreen` + `AuthCard`), passes the resolved methods, and wires
the handlers to `runtime.authClient`. The screen follows the app's theme out
of the box: it renders in the active theme mode (else the
`repobot.theme.json` default) with a token-derived backdrop, and the app's
`BrandMark` names it from `repobot.project.json` `marketing.siteName` (env
`VITE_APP_NAME` overrides). Brand it further via `AuthShell`'s `headline`,
`subheadline`, and `highlights` (the welcome panel) and the card's `brand`,
`title`, and `subtitle` props; restyle via the theme tokens. Nothing in the
card knows about the auth backend — a different backend only needs a new
`AuthClient` implementation in `web/core`.

### The layout follows the register

The kernel's `LoginPage.tsx` is not one fixed composition: it picks the
layout per marketing preset (`AUTH_LAYOUT_BY_PRESET`) — panel-led registers
(dark-dev, soft-saas, warm-boutique, aurora-dark) get the split `AuthShell`
with the branded welcome panel, while typographic and raw registers
(editorial, brutalist, mono-utility, luxe-light) render one centered card
on the themed `AuthScreen` backdrop. The panel copy derives from the IA
manifest (siteName, the home page's description, its seeded bullets), so
the front door speaks the product's own words before any agent runs. Both
the map and the copy live in app code (`LoginPage.tsx`) — overriding the
lean is one word. The theme contract's `character` supplies the panel wash
and card elevation (docs/design-system.md), so the surface treatments
follow the register with no extra wiring.

## Two-factor authentication (TOTP): session elevation

MFA is one inserted state, not a parallel login system: verifying the
primary factor (password, email code, or an OAuth callback) stops being
sufficient to mint a session when the identity has a confirmed second
factor. Everything else — token minting, refresh rotation, sign-out — is
untouched.

### The state machine

```
                     no confirmed factor
credentials OK ────────────────────────────► AuthSession (as today)
      │
      │ confirmed factor
      ▼
MFA_CHALLENGE  ── valid TOTP or recovery code ──► AuthSession
      │
      ├─ wrong code (rate-limited) ──► MFA_CHALLENGE (attempt counted)
      └─ 5 failures in 15 min ──► LOCKED (423) for 15 min
```

The challenge state is carried by a **challenge JWT**: signed with the same
`AUTH_JWT_SECRET`, subject = the identity id, `purpose: "mfa_challenge"`,
5-minute expiry. The data API and `GET /me` reject any token whose
`purpose` is not `access`, so a challenge token grants exactly one thing:
the right to call `/mfa/verify`. No server-side challenge table — expiry
and signature carry the state, matching the stateless access-token design.

Every primary flow funnels through the same seam (`issueSession` in
`BuiltinAuthService`): JSON flows return `{ mfaRequired: true,
challengeToken }` with no tokens; the OAuth redirect callback redirects to
the app with `#mfa_challenge=<jwt>` in place of the token fragment.

### Schema

- `auth_mfa_factors` — one row per identity for v1: `identity_id` (unique),
  `secret` (base32, encrypted at rest with the auth secret), `confirmed_at`
  (null until the first valid code — unconfirmed factors never gate login),
  timestamps.
- `auth_mfa_recovery_codes` — ten per enrollment: `identity_id`,
  `code_hash` (sha256, same discipline as refresh tokens), `used_at`
  (single-use).

### Endpoints (auth function)

| Route               | Auth            | Effect                                                                 |
| ------------------- | --------------- | ---------------------------------------------------------------------- |
| `POST /mfa/enroll`  | access token    | Creates the unconfirmed factor; returns the `otpauth://` URI + secret. |
| `POST /mfa/confirm` | access token    | First valid code confirms; returns the recovery codes exactly once.    |
| `POST /mfa/verify`  | challenge token | Valid TOTP or unused recovery code mints the full session.             |
| `POST /mfa/disable` | access token    | Requires a current code; deletes the factor and recovery codes.        |
| `GET /mfa/status`   | access token    | `{ enabled }` — what the Settings Security section renders from.       |

TOTP is RFC 6238 (SHA-1, 6 digits, 30 s step, ±1 step skew — see
`BuiltinAuth/Totp.ts`), verified with a constant-time compare. Failed verifies count per identity; the lockout
threshold and window live next to the code-request rate limits.

### Clients

- `AuthCard` gains a `challenge` view: 6-digit code input, a "use a
  recovery code instead" toggle, lockout messaging. `AuthClient` grows
  `verifyMfa(challengeToken, code)` and the sign-in methods return a
  discriminated result (`session | mfaChallenge`) instead of a bare session.
- Settings gains a **Security** section: enroll (QR + copyable secret on
  web; on iOS/Android the `otpauth://` URI opens the authenticator app
  directly, with the QR as fallback), confirm, recovery-code display,
  disable.
- The native twins mirror the web flows exactly; `AuthStatus` gains a
  challenge state so the shells can route to the challenge view.

## Related docs

- `docs/auth-emails.md` — customizing the OTP/confirmation/recovery emails.
- `docs/authorization.md` — what happens after sign-in (principals, scoping).
- `docs/environments-and-secrets.md` — how auth secrets and SMTP are wired.
