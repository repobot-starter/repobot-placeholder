import React, { useState } from "react"
import { Button } from "../primitives/Button"
import { Input } from "../primitives/Input"
import { Label } from "../primitives/Label"
import { useResolvedThemeClassName } from "../theme/UiThemeProvider"
import * as styles from "./AuthCard.styles.css"

/**
 * The reusable sign-in surface. Purely presentational: it renders whichever
 * methods the product enables (in the given order) and delegates every action
 * to injected handlers, so it has no dependency on any auth SDK or runtime.
 * That's what lets it live in the design system, render in Storybook with
 * mock handlers, and back any template that needs auth on any backend.
 *
 * Mirrors web/core's AuthMethod registry; kept structural (a plain string
 * union) so the design system stays dependency-free.
 */
export type AuthCardOAuthProvider = "google" | "apple" | "github" | "facebook" | "discord" | "x" | "linkedin"

export type AuthCardMethod = "email-code" | "password" | AuthCardOAuthProvider | "anonymous"

export type AuthCardView = "start" | "code" | "reset" | "reset-verify" | "signup" | "challenge"

export interface AuthCardHandlers {
    /** Send a sign-in code email. Resolve with an optional status message override. */
    onSendCode?: (email: string) => Promise<string | void>
    /** Verify the emailed code; success is expected to flip the app's auth state. */
    onVerifyCode?: (email: string, code: string) => Promise<void>
    onPasswordSignIn?: (email: string, password: string) => Promise<void>
    /** Create an account. Resolve with an optional status message override. */
    onPasswordSignUp?: (email: string, password: string) => Promise<string | void>
    /** Email a password-reset code. Resolve with an optional status message override. */
    onPasswordReset?: (email: string) => Promise<string | void>
    /** Verify the emailed reset code and set a new password; success is expected to flip the app's auth state. */
    onCompletePasswordReset?: (email: string, code: string, newPassword: string) => Promise<void>
    onOAuth?: (provider: AuthCardOAuthProvider) => Promise<void>
    onContinueAsGuest?: () => Promise<void>
    /**
     * Answer a two-factor challenge with a TOTP or recovery code; success is
     * expected to flip the app's auth state. The card switches to its
     * challenge view whenever a sign-in handler rejects with an error named
     * "MfaRequiredError" (web/core's MfaRequiredError — matched by name so
     * the design system stays dependency-free).
     */
    onVerifyMfa?: (code: string) => Promise<void>
    /** Sandbox-only: sign in as the local dev principal. */
    onSandboxSkip?: () => Promise<void>
}

export interface AuthCardProps extends AuthCardHandlers {
    appName: string
    /**
     * Replaces the default initial-mark brand row. Pass null to hide it —
     * e.g. inside AuthShell, whose panel already carries the brand.
     */
    brand?: React.ReactNode
    title?: string
    subtitle?: string
    /** Enabled methods, in render order. Defaults to email codes only. */
    methods?: AuthCardMethod[]
    /** Shows the sandbox footnote (simulated sign-in + dev-user skip). */
    sandbox?: boolean
    /** Pre-seeded error, e.g. read from a failed redirect's URL fragment. */
    initialError?: string
    /** Start on a specific view (useful for Storybook and deep links). */
    initialView?: AuthCardView
    initialEmail?: string
    /**
     * Fires after every internal view transition with the email in play.
     * Apps with dedicated auth routes use it to keep the URL truthful
     * (history.replaceState) without remounting the card mid-flow.
     */
    onViewChange?: (view: AuthCardView, email: string) => void
    /**
     * "card" (default) is the floating surface; "bare" dissolves it — no
     * background, border, or elevation — for the full-bleed minimal front
     * door (`ui.auth.layout: "bare"`). The caller (LoginPage) resolves the
     * theme contract; the card itself stays purely presentational.
     */
    chrome?: "card" | "bare"
    className?: string
}

const oauthLabels: Record<AuthCardOAuthProvider, string> = {
    google: "Continue with Google",
    apple: "Continue with Apple",
    github: "Continue with GitHub",
    facebook: "Continue with Facebook",
    discord: "Continue with Discord",
    x: "Continue with X",
    linkedin: "Continue with LinkedIn",
}

export function AuthCard(props: AuthCardProps): React.ReactElement {
    const methods = props.methods && props.methods.length > 0 ? props.methods : ["email-code" as const]
    const oauthProviders = methods.filter((method): method is AuthCardOAuthProvider => method in oauthLabels)
    const hasEmailCode = methods.includes("email-code")
    const hasPassword = methods.includes("password")
    const hasGuest = methods.includes("anonymous")
    // When both form methods are enabled, the one listed first is primary and
    // a ghost toggle switches to the other.
    const passwordFirst =
        hasPassword && (!hasEmailCode || methods.indexOf("password") < methods.indexOf("email-code"))

    const [view, setView] = useState<AuthCardView>(props.initialView ?? "start")
    const [primaryForm, setPrimaryForm] = useState<"email-code" | "password">(
        passwordFirst ? "password" : "email-code",
    )
    const [email, setEmail] = useState(props.initialEmail ?? "")
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState<string>()
    const [error, setError] = useState<string | undefined>(props.initialError)
    const [pending, setPending] = useState(false)
    const [useRecoveryCode, setUseRecoveryCode] = useState(false)

    const run = async (action: () => Promise<void>): Promise<void> => {
        setError(undefined)
        setMessage(undefined)
        setPending(true)
        try {
            await action()
        } catch (caught) {
            // A second factor isn't a failure: switch to the challenge view.
            if (caught instanceof Error && caught.name === "MfaRequiredError") {
                setCode("")
                setUseRecoveryCode(false)
                changeView("challenge")
                setMessage(caught.message)
            } else {
                setError(describeAuthError(caught))
            }
        } finally {
            setPending(false)
        }
    }

    const changeView = (nextView: AuthCardView): void => {
        setView(nextView)
        props.onViewChange?.(nextView, email)
    }

    const sendCode = (): Promise<void> =>
        run(async () => {
            const override = await props.onSendCode?.(email)
            setCode("")
            changeView("code")
            setMessage(typeof override === "string" ? override : "Code sent — check your inbox.")
        })

    const sendResetCode = (): Promise<void> =>
        run(async () => {
            const override = await props.onPasswordReset?.(email)
            setCode("")
            setPassword("")
            changeView("reset-verify")
            setMessage(typeof override === "string" ? override : "Reset code sent — check your inbox.")
        })

    const goTo = (nextView: AuthCardView): void => {
        setError(undefined)
        setMessage(undefined)
        changeView(nextView)
    }

    const showForm = hasEmailCode || hasPassword
    const activeForm: "email-code" | "password" | undefined = showForm
        ? hasEmailCode && hasPassword
            ? primaryForm
            : hasPassword
              ? "password"
              : "email-code"
        : undefined

    let body: React.ReactElement
    if (view === "challenge") {
        body = (
            <>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void run(() => props.onVerifyMfa?.(code) ?? Promise.resolve())
                    }}
                >
                    <Label htmlFor="mfa-code">
                        {useRecoveryCode ? "Enter a recovery code" : "Enter your authenticator code"}
                    </Label>
                    <Input
                        id="mfa-code"
                        type="text"
                        inputMode={useRecoveryCode ? "text" : "numeric"}
                        autoComplete="one-time-code"
                        required
                        placeholder={useRecoveryCode ? "xxxx-xxxx-xxxx" : "123456"}
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />
                    <Button type="submit" size="lg" disabled={pending || code.length < 6}>
                        Verify
                    </Button>
                </form>
                <div className={styles.secondaryActions}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setError(undefined)
                            setCode("")
                            setUseRecoveryCode(!useRecoveryCode)
                        }}
                    >
                        {useRecoveryCode ? "Use my authenticator app" : "Use a recovery code instead"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => goTo("start")}>
                        Back to sign-in
                    </Button>
                </div>
            </>
        )
    } else if (view === "code") {
        body = (
            <>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void run(() => props.onVerifyCode?.(email, code) ?? Promise.resolve())
                    }}
                >
                    <Label htmlFor="sign-in-code">Enter the code sent to {email}</Label>
                    {/* Codes are 6 digits on newly provisioned projects, but
                        externally configured projects can issue up to 8 —
                        accept the range instead of rejecting valid codes. */}
                    <Input
                        id="sign-in-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6,8}"
                        maxLength={8}
                        required
                        placeholder="123456"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />
                    <Button type="submit" size="lg" disabled={pending || code.length < 6}>
                        Verify code
                    </Button>
                </form>
                <div className={styles.secondaryActions}>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => void sendCode()}>
                        Resend code
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => goTo("start")}>
                        Use a different email
                    </Button>
                </div>
            </>
        )
    } else if (view === "reset") {
        body = (
            <>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void sendResetCode()
                    }}
                >
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                        id="reset-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <Button type="submit" size="lg" disabled={pending || email.length === 0}>
                        Email me a reset code
                    </Button>
                </form>
                <div className={styles.secondaryActions}>
                    <Button variant="ghost" size="sm" onClick={() => goTo("start")}>
                        Back to sign-in
                    </Button>
                </div>
            </>
        )
    } else if (view === "reset-verify") {
        body = (
            <>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void run(
                            () => props.onCompletePasswordReset?.(email, code, password) ?? Promise.resolve(),
                        )
                    }}
                >
                    <Label htmlFor="reset-code">Enter the code sent to {email}</Label>
                    {/* Same 6–8 digit range as the sign-in code input: newly
                        provisioned projects issue 6 digits, externally
                        configured ones can issue up to 8. */}
                    <Input
                        id="reset-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6,8}"
                        maxLength={8}
                        required
                        placeholder="123456"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />
                    <Label htmlFor="reset-new-password">New password</Label>
                    <Input
                        id="reset-new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <Button
                        type="submit"
                        size="lg"
                        disabled={pending || code.length < 6 || password.length < 8}
                    >
                        Set new password
                    </Button>
                </form>
                <div className={styles.secondaryActions}>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => void sendResetCode()}>
                        Resend code
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => goTo("start")}>
                        Back to sign-in
                    </Button>
                </div>
            </>
        )
    } else if (view === "signup") {
        body = (
            <>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void run(async () => {
                            const override = await props.onPasswordSignUp?.(email, password)
                            setMessage(
                                typeof override === "string"
                                    ? override
                                    : "Account created — check your email and click the verification button to finish signing in.",
                            )
                        })
                    }}
                >
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                        id="signup-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <Button
                        type="submit"
                        size="lg"
                        disabled={pending || email.length === 0 || password.length < 8}
                    >
                        Create account
                    </Button>
                </form>
                <div className={styles.secondaryActions}>
                    <Button variant="ghost" size="sm" onClick={() => goTo("start")}>
                        Sign in instead
                    </Button>
                </div>
            </>
        )
    } else {
        body = (
            <>
                {oauthProviders.length > 0 ? (
                    <div className={styles.oauthStack}>
                        {oauthProviders.map((provider) => (
                            <Button
                                key={provider}
                                size="lg"
                                disabled={pending}
                                onClick={() => void run(() => props.onOAuth?.(provider) ?? Promise.resolve())}
                            >
                                {oauthLabels[provider]}
                            </Button>
                        ))}
                    </div>
                ) : null}
                {oauthProviders.length > 0 && (showForm || hasGuest) ? (
                    <div className={styles.divider}>or</div>
                ) : null}
                {activeForm === "password" ? (
                    <form
                        className={styles.form}
                        onSubmit={(event) => {
                            event.preventDefault()
                            void run(() => props.onPasswordSignIn?.(email, password) ?? Promise.resolve())
                        }}
                    >
                        <Label htmlFor="sign-in-email">Email</Label>
                        <Input
                            id="sign-in-email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                        <Label htmlFor="sign-in-password">Password</Label>
                        <Input
                            id="sign-in-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="Your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <Button
                            type="submit"
                            size="lg"
                            variant={oauthProviders.length > 0 ? "secondary" : "primary"}
                            disabled={pending || email.length === 0 || password.length === 0}
                        >
                            Sign in
                        </Button>
                    </form>
                ) : null}
                {activeForm === "email-code" ? (
                    <form
                        className={styles.form}
                        onSubmit={(event) => {
                            event.preventDefault()
                            void sendCode()
                        }}
                    >
                        <Label htmlFor="sign-in-email">Email</Label>
                        <Input
                            id="sign-in-email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                        <Button
                            type="submit"
                            size="lg"
                            variant={oauthProviders.length > 0 ? "secondary" : "primary"}
                            disabled={pending || email.length === 0}
                        >
                            Email me a sign-in code
                        </Button>
                    </form>
                ) : null}
                {activeForm !== undefined || hasGuest ? (
                    <div className={styles.secondaryActions}>
                        {activeForm === "password" ? (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => goTo("reset")}>
                                    Forgot password?
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => goTo("signup")}>
                                    Create an account
                                </Button>
                            </>
                        ) : null}
                        {hasEmailCode && hasPassword ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setError(undefined)
                                    setMessage(undefined)
                                    setPrimaryForm(primaryForm === "password" ? "email-code" : "password")
                                }}
                            >
                                {primaryForm === "password"
                                    ? "Email me a code instead"
                                    : "Use a password instead"}
                            </Button>
                        ) : null}
                        {hasGuest ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={() =>
                                    void run(() => props.onContinueAsGuest?.() ?? Promise.resolve())
                                }
                            >
                                Continue as guest
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </>
        )
    }

    const cardClass = [styles.card, props.chrome === "bare" ? styles.cardBare : undefined, props.className]
        .filter(Boolean)
        .join(" ")
    return (
        <div className={cardClass} data-chrome={props.chrome ?? "card"}>
            {props.brand === null ? null : (props.brand ?? <DefaultBrand appName={props.appName} />)}
            <div>
                <h1 className={styles.heading}>{props.title ?? defaultTitle(view)}</h1>
                <p className={styles.subheading}>{props.subtitle ?? defaultSubtitle(view, methods)}</p>
            </div>
            {body}
            {message ? <p className={styles.message}>{message}</p> : null}
            {error ? <p className={styles.errorMessage}>{error}</p> : null}
            {props.sandbox && view === "start" ? (
                <p className={styles.footnote}>
                    Sandbox mode — sign-in is simulated, no email is sent.{" "}
                    <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={() => void run(() => props.onSandboxSkip?.() ?? Promise.resolve())}
                    >
                        Skip as local dev user
                    </button>
                </p>
            ) : null}
        </div>
    )
}

export interface AuthScreenProps {
    children: React.ReactNode
    /** Theme class applied to the screen; defaults to the app's active theme mode. */
    themeClassName?: string
    /** Appended after the default backdrop styles for overrides. */
    className?: string
}

/**
 * Full-viewport backdrop that centers an AuthCard. The login surface is the
 * product's front door, so it follows the same theme resolution as the rest
 * of the app (active mode, else the repobot.theme.json default) and its
 * backdrop derives from the theme tokens — the brand carries through instead
 * of a fixed dark canvas.
 */
export function AuthScreen(props: AuthScreenProps): React.ReactElement {
    const resolvedThemeClassName = useResolvedThemeClassName()
    const classes = [props.themeClassName ?? resolvedThemeClassName, styles.screen, props.className]
    return <div className={classes.filter(Boolean).join(" ")}>{props.children}</div>
}

function DefaultBrand({ appName }: { appName: string }): React.ReactElement {
    return (
        <span className={styles.brandRow}>
            <span className={styles.brandMark} aria-hidden="true">
                {appName.charAt(0).toUpperCase()}
            </span>
            <span className={styles.brandName}>{appName}</span>
        </span>
    )
}

/** Each view is its own destination (routes can deep-link in), so the heading follows it. */
function defaultTitle(view: AuthCardView): string {
    switch (view) {
        case "signup":
            return "Create your account"
        case "reset":
            return "Reset your password"
        case "reset-verify":
            return "Set a new password"
        case "code":
            return "Check your inbox"
        case "challenge":
            return "Two-factor authentication"
        default:
            return "Welcome back"
    }
}

function defaultSubtitle(view: AuthCardView, methods: readonly AuthCardMethod[]): string {
    switch (view) {
        case "signup":
            return "A few seconds and you're in."
        case "reset":
            return "We'll email you a reset code."
        case "reset-verify":
            return "Enter the emailed code and choose a new password."
        case "code":
            return "We sent you a 6-digit sign-in code."
        case "challenge":
            return "Enter the code from your authenticator app to finish signing in."
        default:
            break
    }
    if (methods.includes("email-code")) {
        return "Sign in with your email — we'll send you a 6-digit code."
    }
    if (methods.includes("password")) {
        return "Sign in with your email and password."
    }
    return "Choose how you'd like to continue."
}

/**
 * Auth backends can fail with messages that are useless to show (an empty
 * string, or a raw response body like "{}" when a token hook errors); fall
 * back to a human sentence unless the message actually says something.
 */
function describeAuthError(caught: unknown): string {
    if (caught instanceof Error && /[a-zA-Z]/.test(caught.message)) {
        return caught.message.trim()
    }
    return "Sign-in failed — please try again."
}
