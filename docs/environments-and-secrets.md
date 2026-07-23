# Environments and Secrets

Four environments with increasing trust: `local` (laptop/sandbox — no cloud, no real secrets), `test` (CI — no secrets, boundaries stubbed), `dev` and `prod` (real cloud resources, attached by the Repobot platform).

## The manifest

`env.manifest.json` at the repo root is the single source of truth for every variable: name, owning package, class, environments, and provisioner hint. Three classes:

- **config** — non-secret, committed defaults (ports, endpoints, modes).
- **public** — per-project client-safe values (auth endpoint URL, site URL). These are the only values allowed in `VITE_` variables.
- **secret** — server-only (DATABASE_URL, AUTH_JWT_SECRET). Live in GCP Secret Manager (deployed), GitHub environment secrets (CI/deploy), or generated locally. Never in git, never in `VITE_`.

## Recipe: add an environment variable

One change, three places: `env.manifest.json` + the package's env access module (`firebase/functions/src/Utils/Environment.ts` for the backend) + the package's `.env.example`. `npm run bootstrap:env` then produces it locally; the platform reads the manifest when provisioning attached environments.

## Local bootstrap

`npm run bootstrap:env` generates `.env.local` files from the manifest: defaults for config vars, fresh random values for generated secrets, and a signed local dev-auth JWT. Values already present in the process environment (e.g. injected by a sandbox) win. Idempotent — existing files are untouched; delete one and re-run to regenerate.

## Auth modes

- `AUTH_MODE=local`: emulator-only. The backend verifies the bootstrap-signed dev token and auto-provisions a "Local Dev" account/user on first request. Deployed boot refuses this mode by design — never weaken that check.
- `AUTH_MODE=builtin`: the kernel's own auth service (`auth__request__api` + the `BuiltinAuth` services) issues and verifies HS256 JWTs signed with `AUTH_JWT_SECRET`; identities live in the environment's own Postgres. Requires `AUTH_JWT_SECRET`, `AUTH_PUBLIC_URL`, and `APP_BASE_URL`; SMTP (`SMTP_*`) enables OTP/recovery emails, and `GOOGLE_SIGNIN_CLIENT_ID`/`SECRET` enable Google sign-in.

## Payments modes

- `PAYMENTS_MODE=local`: emulator/tests only (deployed boot refuses it). Checkout sessions are simulated in-app; no Stripe calls, no keys.
- `PAYMENTS_MODE=stripe`: real Stripe Checkout Sessions using `STRIPE_SECRET_KEY`, injected at deploy time from the account's connected Stripe integration when the deploy manifest declares the `PAYMENTS` capability. See `docs/payments.md`.

## AI modes

- `AI_MODE=local`: emulator/sandbox default. The chat assistant is simulated server-side with the identical streaming protocol (reasoning, a real tool run, token-by-token answers) — no key, no cost. Voice sessions refuse in this mode, since realtime speech has no simulation.
- `AI_MODE=openai`: the real model using `OPENAI_API_KEY`, injected at deploy time from the account's connected OpenAI integration when the deploy manifest declares the `AI` capability. See `docs/ai.md`.

## Deploys

GitHub Actions deploys authenticate to GCP via Workload Identity Federation (no stored keys); `dev`/`prod` are GitHub Environments with protection rules. See `.github/workflows/deploy.yml` for the one-time setup checklist.
