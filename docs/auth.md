# Auth

Auth is a modular kernel component with three layers. Understanding the split
is what lets you restyle the login surface, add a sign-in method, or reuse
auth in a new template without touching the other layers.

| Layer   | Where                                           | What it owns                                                                                                                                 |
| ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface | `web/design-system/src/components/AuthCard.tsx` | The sign-in UI: layout, method rendering, view states (code entry, reset, sign-up). Purely presentational — handlers are injected.           |
| Client  | `web/core/src/Auth/`                            | The `AuthClient` interface and the two implementations: `BuiltinAuthClient` (deployed) and `LocalAuthClient` (sandbox dev JWT).              |
| Backend | `firebase/functions/src/Services/Identity/`     | Token verification (`TokenVerifier`), the built-in auth service (`BuiltinAuth/`, exposed as `auth__request__api`), and user/account linking. |

The iOS (`ios/App/Auth/`, `ios/App/View/SignIn/`) and Android
(`android/.../auth/`, `.../view/signin/`) apps mirror the client + surface
layers natively.

## Sign-in methods are config, not code

The method registry lives in `web/core/src/Auth/AuthMethods.ts`. Deployments
choose methods with the `VITE_AUTH_METHODS` env value (`AUTH_METHODS` on
native): a comma-separated, ordered list of:

| Method       | Notes                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `email-code` | Default. Email OTP with a magic-link fallback. Works on every provisioned project with zero setup.                                                                             |
| `password`   | Email + password, with sign-up, and code-based password reset.                                                                                                                 |
| `google`     | OAuth redirect flow. Requires a Google OAuth client (`GOOGLE_SIGNIN_CLIENT_ID`/`SECRET`, injected from the platform's Google Sign-In integration). Apple is not yet supported. |
| `anonymous`  | "Continue as guest". Guests are keyed by a synthetic `guest-<sub>@anonymous.invalid` email (see `GuestIdentity.ts`).                                                           |

The list's order is the render order of the sign-in surface. All three
platforms parse the value with identical semantics — the parity contract is
pinned by `web/app/tests/Auth/AuthMethods.test.ts`,
`ios/AppTests/AuthMethodsTests.swift`, and
`android/app/src/test/.../AuthMethodsTest.kt`.

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

## Reusing auth in a new template

A template that needs auth renders `AuthScreen` + `AuthCard`, passes the
resolved methods, and wires the handlers to `runtime.authClient`. Brand it
via the `brand`, `title`, and `subtitle` props; restyle it via
`AuthScreen`'s `themeClassName`/`className` or the theme tokens. Nothing in
the card knows about the auth backend — a different backend only needs a new
`AuthClient` implementation in `web/core`.

## Related docs

- `docs/auth-emails.md` — customizing the OTP/confirmation/recovery emails.
- `docs/authorization.md` — what happens after sign-in (principals, scoping).
- `docs/environments-and-secrets.md` — how auth secrets and SMTP are wired.
