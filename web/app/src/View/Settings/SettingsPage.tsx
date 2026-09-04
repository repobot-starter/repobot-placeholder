import { resolveAuthMethods, type MfaEnrollment } from "@base/core"
import { Badge, Button, Input, Label, UiQueryViewFormModal } from "@ui"
import QRCode from "qrcode"
import React, { useEffect, useRef, useState } from "react"
import { buildPublicFileUrl, deriveStorageEndpoint, formatMinorUnits, putUploadBytes } from "@base/core"
import { hasDeployCapability } from "../../Config/deployCapabilities"
import { runtime } from "../../Config/Runtime"
import {
    useCreateBillingPortalSessionMutation,
    useCreateUploadMutation,
    useCurrentUserQuery,
    useDeleteUploadMutation,
    useFinalizeUploadMutation,
    useMySubscriptionQuery,
    useRegisterPushDeviceMutation,
    useUnregisterPushDeviceMutation,
    useUpdateUserMutation,
    useUserUpdateFormSchemaLazyQuery,
    type UpdateUserFields,
} from "../../generated/graphql/types"
import * as styles from "./SettingsPage.styles.css"

const isBuiltinAuth = import.meta.env.VITE_AUTH_MODE === "builtin"

const authMethods = resolveAuthMethods({
    methodsValue: import.meta.env.VITE_AUTH_METHODS,
    googleEnabled: import.meta.env.VITE_AUTH_GOOGLE_ENABLED === "true",
})

// Changing a password needs the builtin auth API and the password method
// enabled; in sandbox (local) mode there is no password to manage.
const canChangePassword = isBuiltinAuth && authMethods.includes("password")

/**
 * The signed-in account settings destination: profile fields (edited through
 * the same backend-driven user update SchemaForm the Users page uses), the
 * read-only auth identity, an optional password change (builtin auth with the
 * password method only), and sign out.
 */
export default function SettingsPage(): React.ReactElement {
    const currentUserQuery = useCurrentUserQuery()
    const user = currentUserQuery.data?.currentUser

    const [editOpen, setEditOpen] = useState(false)
    const [submitError, setSubmitError] = useState<string>()

    // network-only: cached form schemas would carry stale defaultData after edits.
    const [fetchUpdateSchema, updateSchemaState] = useUserUpdateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [updateUser, updateState] = useUpdateUserMutation()

    const openEdit = (): void => {
        if (!user) {
            return
        }
        setSubmitError(undefined)
        setEditOpen(true)
        void fetchUpdateSchema({ variables: { input: { objectId: user.id } } })
    }

    const submitProfile = async (formData: Record<string, unknown>): Promise<void> => {
        if (!user) {
            return
        }
        setSubmitError(undefined)
        try {
            await updateUser({
                variables: {
                    input: {
                        objectId: user.id,
                        idempotencyKey: crypto.randomUUID(),
                        fields: formData as unknown as UpdateUserFields,
                    },
                },
                refetchQueries: ["CurrentUser"],
            })
            setEditOpen(false)
        } catch (caught) {
            setSubmitError(caught instanceof Error ? caught.message : "Saving failed.")
        }
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Settings</h1>

            <section className={styles.card} aria-label="Profile">
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Profile</h2>
                    <Button variant="secondary" size="sm" onClick={openEdit} disabled={!user}>
                        Edit profile
                    </Button>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Display name</span>
                    <span className={styles.fieldValue}>{user?.displayName ?? "—"}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Account</span>
                    <span className={styles.fieldValue}>{user?.account?.name ?? "—"}</span>
                </div>
            </section>

            {/* Capability-gated: the avatar pipeline writes through the
                storage kernel, so without STORAGE declared the card would be
                an upload button that fails at runtime once deployed. */}
            {hasDeployCapability("STORAGE") ? (
                <AvatarCard
                    userId={user?.id}
                    displayName={user?.displayName}
                    avatarUploadId={user?.avatarUploadId ?? undefined}
                />
            ) : null}

            <section className={styles.card} aria-label="Auth identity">
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Auth identity</h2>
                </div>
                <p className={styles.cardDescription}>
                    How you sign in. These values come from the auth kernel and are read-only.
                </p>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Email</span>
                    <span className={styles.fieldValue}>{user?.email ?? "—"}</span>
                </div>
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Auth mode</span>
                    <span className={styles.fieldValue}>
                        <Badge tone={isBuiltinAuth ? "accent" : "neutral"}>
                            {isBuiltinAuth ? "Built-in auth" : "Sandbox dev session"}
                        </Badge>
                    </span>
                </div>
            </section>

            {canChangePassword ? <ChangePasswordCard /> : null}

            <NotificationsCard />

            {isBuiltinAuth ? <SecurityCard /> : null}

            <BillingCard />

            <section className={styles.card} aria-label="Session">
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Session</h2>
                </div>
                <p className={styles.cardDescription}>Sign out of this device.</p>
                <div className={styles.actionsRow}>
                    <Button variant="danger" onClick={() => void runtime.authClient.signOut()}>
                        Sign out
                    </Button>
                </div>
            </section>

            {editOpen ? (
                <UiQueryViewFormModal
                    open
                    title="Edit profile"
                    schemaForm={updateSchemaState.data?.schema}
                    loading={updateSchemaState.loading}
                    error={updateSchemaState.error?.message}
                    submitting={updateState.loading}
                    submitError={submitError}
                    onSubmit={submitProfile}
                    onClose={() => setEditOpen(false)}
                />
            ) : null}
        </div>
    )
}

const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

interface AvatarCardProps {
    userId: string | undefined
    displayName: string | undefined
    avatarUploadId: string | undefined
}

/**
 * The storage kernel's consumer exemplar: pick an image, upload it through
 * the kernel (createUpload -> PUT bytes -> finalizeUpload), and persist the
 * upload id on the user row. The avatar is a PUBLIC upload, so the app shell
 * renders it with the stable /file/<id> serving URL; replacing it deletes
 * the previous upload (best effort) so orphaned objects don't accumulate.
 */
function AvatarCard({ userId, displayName, avatarUploadId }: AvatarCardProps): React.ReactElement {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string>()

    const [createUpload] = useCreateUploadMutation()
    const [finalizeUpload] = useFinalizeUploadMutation()
    const [deleteUpload] = useDeleteUploadMutation()
    const [updateUser] = useUpdateUserMutation()

    const uploadAvatar = async (file: File): Promise<void> => {
        if (userId === undefined) {
            return
        }
        setError(undefined)
        setUploading(true)
        try {
            const slotResult = await createUpload({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: {
                            contentType: file.type,
                            sizeBytes: file.size,
                            visibility: "PUBLIC",
                        },
                    },
                },
            })
            const slot = slotResult.data?.createUpload
            if (slot === undefined) {
                throw new Error("The upload could not be created.")
            }
            await putUploadBytes({
                endpoint: storageEndpoint(),
                uploadUrl: slot.uploadUrl,
                headersJson: slot.headersJson,
                body: file,
            })
            await finalizeUpload({ variables: { input: { uploadId: slot.uploadId } } })
            await updateUser({
                variables: {
                    input: {
                        objectId: userId,
                        idempotencyKey: crypto.randomUUID(),
                        fields: { avatarUploadId: slot.uploadId } as UpdateUserFields,
                    },
                },
                refetchQueries: ["CurrentUser"],
            })
            if (avatarUploadId !== undefined) {
                // Best effort: a failed cleanup leaves an orphaned object, not
                // a broken avatar.
                await deleteUpload({ variables: { input: { uploadId: avatarUploadId } } }).catch(
                    () => undefined,
                )
            }
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Uploading the avatar failed.")
        } finally {
            setUploading(false)
        }
    }

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (file !== undefined) {
            void uploadAvatar(file)
        }
    }

    return (
        <section className={styles.card} aria-label="Avatar">
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Avatar</h2>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={userId === undefined || uploading}
                >
                    {uploading ? "Uploading…" : avatarUploadId !== undefined ? "Replace" : "Upload"}
                </Button>
            </div>
            <p className={styles.cardDescription}>
                Shown next to your name in the app. Uploaded through the storage kernel and visible to anyone
                with the link.
            </p>
            <div className={styles.fieldRow}>
                {avatarUploadId !== undefined ? (
                    <img
                        src={buildPublicFileUrl(storageEndpoint(), avatarUploadId)}
                        alt={`${displayName ?? "User"} avatar`}
                        className={styles.avatarPreview}
                    />
                ) : (
                    <span className={styles.avatarPlaceholder} aria-hidden="true">
                        {(displayName ?? "?").charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            {error !== undefined ? <p className={styles.errorMessage}>{error}</p> : null}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFileChange}
                className={styles.hiddenFileInput}
            />
        </section>
    )
}

const subscriptionBadgeTone = {
    ACTIVE: "success",
    PAST_DUE: "danger",
    CANCELED: "neutral",
} as const

const subscriptionStatusLabel = {
    ACTIVE: "Active",
    PAST_DUE: "Past due",
    CANCELED: "Cancelled",
} as const

/**
 * The billing section: the caller's subscription (payments kernel,
 * mySubscription) with its status and renewal date, and a "Manage billing"
 * button that opens the Billing Portal (Stripe's hosted portal when
 * deployed, the in-app test billing page in the sandbox). Renders nothing
 * for accounts that have never subscribed, so packs without subscriptions
 * keep their settings page unchanged.
 */
function BillingCard(): React.ReactElement | null {
    const subscriptionQuery = useMySubscriptionQuery({ fetchPolicy: "network-only" })
    const [createPortalSession, portalState] = useCreateBillingPortalSessionMutation()
    const [error, setError] = useState<string>()

    const subscription = subscriptionQuery.data?.mySubscription
    if (subscription === undefined || subscription === null) {
        return null
    }

    const priceLabel = `${formatMinorUnits(subscription.amountTotal, subscription.currency)} / ${subscription.recurringInterval.toLowerCase()}`
    const renewalDate =
        subscription.currentPeriodEnd != null
            ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
            : undefined

    const manageBilling = async (): Promise<void> => {
        setError(undefined)
        try {
            const result = await createPortalSession({
                variables: { input: { origin: window.location.origin } },
            })
            const url = result.data?.createBillingPortalSession.url
            if (url === undefined) {
                setError("The billing portal could not be opened.")
                return
            }
            window.location.assign(url)
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "The billing portal could not be opened.")
        }
    }

    return (
        <section className={styles.card} aria-label="Billing">
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Billing</h2>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void manageBilling()}
                    disabled={portalState.loading}
                >
                    {portalState.loading ? "Opening…" : "Manage billing"}
                </Button>
            </div>
            <p className={styles.cardDescription}>
                Your subscription. Payment methods, invoices, and cancellation are managed through the billing
                portal.
            </p>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Plan</span>
                <span className={styles.fieldValue}>
                    {subscription.productName} · {priceLabel}
                </span>
            </div>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Status</span>
                <span className={styles.fieldValue}>
                    <Badge tone={subscriptionBadgeTone[subscription.status]}>
                        {subscriptionStatusLabel[subscription.status]}
                    </Badge>
                </span>
            </div>
            {renewalDate !== undefined ? (
                <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Renews</span>
                    <span className={styles.fieldValue}>{renewalDate}</span>
                </div>
            ) : null}
            {error !== undefined ? <p className={styles.errorMessage}>{error}</p> : null}
        </section>
    )
}

const PUSH_SERVICE_WORKER_URL = "/push-service-worker.js"

// The VAPID public key rides the same runtime-config path as the GraphQL URL
// and auth config: a VITE_ env var the platform stages per environment
// (docs/push.md). Empty = push is not provisioned here.
const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ""

const pushSupported =
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" &&
    "PushManager" in window &&
    "Notification" in window

/** Decodes the base64url VAPID public key into applicationServerKey bytes. */
function vapidKeyBytes(base64UrlKey: string): Uint8Array {
    const padded = base64UrlKey + "=".repeat((4 - (base64UrlKey.length % 4)) % 4)
    const raw = window.atob(padded.replaceAll("-", "+").replaceAll("_", "/"))
    return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

type PushPreference =
    | "unsupported" // this browser has no service worker / Push API
    | "unconfigured" // no VAPID public key staged for this environment
    | "checking" // reading the existing subscription state on mount
    | "off"
    | "on"
    | "denied" // notification permission is blocked in browser settings

/**
 * The push kernel's web enable/disable surface (docs/push.md): a per-user
 * "Notifications" preference. Enabling registers the push service worker,
 * asks for notification permission (only here, never on page load),
 * subscribes with the environment's VAPID key, and registers the
 * subscription through the kernel GraphQL. Disabling deletes the
 * registration server-side first, then unsubscribes the browser.
 */
function NotificationsCard(): React.ReactElement {
    const [preference, setPreference] = useState<PushPreference>(
        !pushSupported ? "unsupported" : vapidPublicKey === "" ? "unconfigured" : "checking",
    )
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string>()

    const [registerPushDevice] = useRegisterPushDeviceMutation()
    const [unregisterPushDevice] = useUnregisterPushDeviceMutation()

    // Reads existing state only — never registers the worker or prompts.
    useEffect(() => {
        if (!pushSupported || vapidPublicKey === "") {
            return
        }
        let cancelled = false
        void navigator.serviceWorker
            .getRegistration(PUSH_SERVICE_WORKER_URL)
            .then((registration) => registration?.pushManager.getSubscription())
            .then((subscription) => {
                if (cancelled) {
                    return
                }
                if (subscription != null) {
                    setPreference("on")
                } else {
                    setPreference(Notification.permission === "denied" ? "denied" : "off")
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPreference("off")
                }
            })
        return () => {
            cancelled = true
        }
    }, [])

    const enable = async (): Promise<void> => {
        setError(undefined)
        setBusy(true)
        try {
            const registration = await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_URL)
            // The permission prompt fires here, in direct response to the
            // user's click — the only place the app ever requests it.
            const permission = await Notification.requestPermission()
            if (permission === "denied") {
                setPreference("denied")
                return
            }
            if (permission !== "granted") {
                setError("The permission prompt was dismissed. Enable again to retry.")
                return
            }
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKeyBytes(vapidPublicKey),
            })
            try {
                await registerPushDevice({
                    variables: {
                        input: {
                            platform: "WEB",
                            endpoint: subscription.endpoint,
                            subscriptionJson: JSON.stringify(subscription),
                        },
                    },
                })
            } catch (caught) {
                // Keep browser and backend consistent: an unregistered
                // subscription would push to no one, so drop it (best effort).
                await subscription.unsubscribe().catch(() => undefined)
                throw caught
            }
            setPreference("on")
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Enabling notifications failed.")
        } finally {
            setBusy(false)
        }
    }

    const disable = async (): Promise<void> => {
        setError(undefined)
        setBusy(true)
        try {
            const registration = await navigator.serviceWorker.getRegistration(PUSH_SERVICE_WORKER_URL)
            const subscription = await registration?.pushManager.getSubscription()
            if (subscription != null) {
                // Server first: if the delete fails the browser subscription
                // survives and the preference honestly stays on.
                await unregisterPushDevice({
                    variables: { input: { endpoint: subscription.endpoint } },
                })
                await subscription.unsubscribe()
            }
            setPreference("off")
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Disabling notifications failed.")
        } finally {
            setBusy(false)
        }
    }

    const statusBadge = {
        unsupported: { tone: "neutral", label: "Unavailable" },
        unconfigured: { tone: "neutral", label: "Not configured" },
        checking: { tone: "neutral", label: "Checking…" },
        off: { tone: "neutral", label: "Off" },
        on: { tone: "success", label: "On" },
        denied: { tone: "danger", label: "Blocked" },
    } as const

    const canEnable = preference === "off" || preference === "denied"

    return (
        <section className={styles.card} aria-label="Notifications">
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Notifications</h2>
                {canEnable || preference === "on" ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void (preference === "on" ? disable() : enable())}
                        disabled={busy}
                    >
                        {busy ? "Working…" : preference === "on" ? "Disable" : "Enable"}
                    </Button>
                ) : null}
            </div>
            <p className={styles.cardDescription}>
                Browser notifications from this app — for example the daily activity digest. Your browser asks
                for permission when you enable them.
            </p>
            <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Status</span>
                <span className={styles.fieldValue}>
                    <Badge tone={statusBadge[preference].tone}>{statusBadge[preference].label}</Badge>
                </span>
            </div>
            {preference === "unsupported" ? (
                <p className={styles.cardDescription}>This browser does not support push notifications.</p>
            ) : null}
            {preference === "unconfigured" ? (
                <p className={styles.cardDescription}>
                    Push notifications are not configured in this environment.
                </p>
            ) : null}
            {preference === "denied" ? (
                <p className={styles.cardDescription}>
                    Notifications are blocked in your browser settings. Allow notifications for this site,
                    then enable them again here.
                </p>
            ) : null}
            {error !== undefined ? <p className={styles.errorMessage}>{error}</p> : null}
        </section>
    )
}

type SecurityCardState =
    | { step: "loading" }
    | { step: "disabled" }
    | { step: "enrolling"; enrollment: MfaEnrollment; qrDataUrl?: string }
    | { step: "recoveryCodes"; codes: string[] }
    | { step: "enabled" }

/**
 * Two-factor authentication (builtin auth only): enroll an authenticator app
 * (QR + copyable secret), confirm with the first code to get the recovery
 * codes (shown exactly once), and disable with a current code. Guests see
 * the enroll button fail with the kernel's descriptive error.
 */
function SecurityCard(): React.ReactElement {
    const [state, setState] = useState<SecurityCardState>({ step: "loading" })
    const [code, setCode] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string>()

    useEffect(() => {
        let cancelled = false
        void runtime.authClient.fetchMfaEnabled().then((enabled) => {
            if (!cancelled) {
                setState({ step: enabled ? "enabled" : "disabled" })
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    const act = async (action: () => Promise<void>): Promise<void> => {
        setError(undefined)
        setBusy(true)
        try {
            await action()
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "The request failed.")
        } finally {
            setBusy(false)
        }
    }

    const enroll = (): Promise<void> =>
        act(async () => {
            const enrollment = await runtime.authClient.enrollMfa()
            setCode("")
            setState({ step: "enrolling", enrollment })
            // The QR is a rendering nicety; manual secret entry always works.
            try {
                const qrDataUrl = await QRCode.toDataURL(enrollment.otpauthUri, { margin: 1, width: 176 })
                setState({ step: "enrolling", enrollment, qrDataUrl })
            } catch {
                // Keep the secret-only enrollment view.
            }
        })

    const confirm = (): Promise<void> =>
        act(async () => {
            const codes = await runtime.authClient.confirmMfa(code)
            setCode("")
            setState({ step: "recoveryCodes", codes })
        })

    const disable = (): Promise<void> =>
        act(async () => {
            await runtime.authClient.disableMfa(code)
            setCode("")
            setState({ step: "disabled" })
        })

    return (
        <section className={styles.card} aria-label="Two-factor authentication">
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Two-factor authentication</h2>
                {state.step === "enabled" || state.step === "recoveryCodes" ? (
                    <Badge tone="success">Enabled</Badge>
                ) : state.step === "disabled" ? (
                    <Badge tone="neutral">Off</Badge>
                ) : null}
            </div>
            <p className={styles.cardDescription}>
                Protect your account with an authenticator app: signing in asks for a 6-digit code after your
                password or email code.
            </p>

            {state.step === "disabled" ? (
                <div className={styles.actionsRow}>
                    <Button variant="secondary" onClick={() => void enroll()} disabled={busy}>
                        {busy ? "Preparing…" : "Enable two-factor authentication"}
                    </Button>
                </div>
            ) : null}

            {state.step === "enrolling" ? (
                <>
                    <p className={styles.cardDescription}>
                        Scan the QR code with your authenticator app (or enter the secret manually), then
                        confirm with the first code it shows.
                    </p>
                    {state.qrDataUrl !== undefined ? (
                        <img
                            src={state.qrDataUrl}
                            alt="Authenticator enrollment QR code"
                            width={176}
                            height={176}
                        />
                    ) : null}
                    <div className={styles.fieldRow}>
                        <span className={styles.fieldLabel}>Secret</span>
                        <span className={styles.fieldValue}>
                            <code>{state.enrollment.secret}</code>
                        </span>
                    </div>
                    <form
                        className={styles.passwordForm}
                        onSubmit={(event) => {
                            event.preventDefault()
                            void confirm()
                        }}
                    >
                        <Label htmlFor="settings-mfa-confirm-code">Code from your app</Label>
                        <Input
                            id="settings-mfa-confirm-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="123456"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <div className={styles.actionsRow}>
                            <Button type="submit" disabled={busy || code.length < 6}>
                                {busy ? "Confirming…" : "Confirm"}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setError(undefined)
                                    setState({ step: "disabled" })
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </>
            ) : null}

            {state.step === "recoveryCodes" ? (
                <>
                    <p className={styles.cardDescription}>
                        Two-factor authentication is on. Save these recovery codes somewhere safe — each one
                        signs you in once if you lose your authenticator. They are shown only now.
                    </p>
                    <pre className={styles.fieldValue}>{state.codes.join("\n")}</pre>
                    <div className={styles.actionsRow}>
                        <Button variant="secondary" onClick={() => setState({ step: "enabled" })}>
                            I saved my recovery codes
                        </Button>
                    </div>
                </>
            ) : null}

            {state.step === "enabled" ? (
                <form
                    className={styles.passwordForm}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void disable()
                    }}
                >
                    <Label htmlFor="settings-mfa-disable-code">
                        Current code (or a recovery code) to turn off
                    </Label>
                    <Input
                        id="settings-mfa-disable-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                    />
                    <div className={styles.actionsRow}>
                        <Button type="submit" variant="danger" disabled={busy || code.length < 6}>
                            {busy ? "Disabling…" : "Disable two-factor authentication"}
                        </Button>
                    </div>
                </form>
            ) : null}

            {error !== undefined ? <p className={styles.errorMessage}>{error}</p> : null}
        </section>
    )
}

const MIN_PASSWORD_LENGTH = 8

function ChangePasswordCard(): React.ReactElement {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string>()
    const [saved, setSaved] = useState(false)

    const submit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault()
        setError(undefined)
        setSaved(false)
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
            return
        }
        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.")
            return
        }
        setSaving(true)
        try {
            await runtime.authClient.updatePassword(newPassword)
            setNewPassword("")
            setConfirmPassword("")
            setSaved(true)
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Changing the password failed.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className={styles.card} aria-label="Password">
            <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Password</h2>
            </div>
            <p className={styles.cardDescription}>Set a new password for your account.</p>
            <form className={styles.passwordForm} onSubmit={(event) => void submit(event)}>
                <Label htmlFor="settings-new-password">New password</Label>
                <Input
                    id="settings-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                />
                <Label htmlFor="settings-confirm-password">Confirm new password</Label>
                <Input
                    id="settings-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                />
                {error ? <p className={styles.errorMessage}>{error}</p> : null}
                {saved ? <p className={styles.successMessage}>Password updated.</p> : null}
                <div className={styles.actionsRow}>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Change password"}
                    </Button>
                </div>
            </form>
        </section>
    )
}
