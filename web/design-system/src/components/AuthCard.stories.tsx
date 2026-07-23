import type { Meta, StoryObj } from "@storybook/react"
import { AuthCard, AuthScreen } from "./AuthCard"

/**
 * Mock handlers so every flow is clickable in Storybook without any backend:
 * sends "succeed", verifications succeed after a short delay, and the
 * password sign-in rejects to demonstrate error rendering.
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const mockHandlers = {
    onSendCode: async (): Promise<void> => delay(300),
    onVerifyCode: async (): Promise<void> => delay(300),
    onPasswordSignIn: async (): Promise<void> => {
        await delay(300)
        throw new Error("Invalid login credentials")
    },
    onPasswordSignUp: async (): Promise<void> => delay(300),
    onPasswordReset: async (): Promise<void> => delay(300),
    onCompletePasswordReset: async (): Promise<void> => delay(300),
    onOAuth: async (): Promise<void> => delay(300),
    onContinueAsGuest: async (): Promise<void> => delay(300),
    onSandboxSkip: async (): Promise<void> => delay(300),
}

const meta: Meta<typeof AuthCard> = {
    title: "Components/AuthCard",
    component: AuthCard,
    parameters: { layout: "fullscreen" },
    args: {
        appName: "AuthBot",
        ...mockHandlers,
    },
    decorators: [
        (Story) => (
            <AuthScreen>
                <Story />
            </AuthScreen>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof AuthCard>

/** The provisioned default: email one-time codes only. */
export const EmailCode: Story = { args: { methods: ["email-code"] } }

/** Sandbox flavor: same surface plus the local dev-user skip footnote. */
export const Sandbox: Story = { args: { methods: ["email-code"], sandbox: true } }

/** Everything on: OAuth buttons, password primary, code fallback, guest. */
export const AllMethods: Story = {
    args: { methods: ["google", "apple", "password", "email-code", "anonymous"] },
}

/** Password-only SaaS style, with reset + signup reachable via links. */
export const PasswordOnly: Story = { args: { methods: ["password"] } }

/** OAuth-only (no email forms at all). */
export const OAuthOnly: Story = { args: { methods: ["google", "apple"] } }

/** Guest-friendly game/tool: play first, sign in with email later. */
export const GuestFirst: Story = { args: { methods: ["anonymous", "email-code"] } }

/** The code-entry step, reached after a send (seeded directly here). */
export const CodeEntry: Story = {
    args: { methods: ["email-code"], initialView: "code", initialEmail: "you@example.com" },
}

/** Password reset, step one: request the emailed reset code. */
export const PasswordReset: Story = {
    args: { methods: ["password"], initialView: "reset", initialEmail: "you@example.com" },
}

/** Password reset, step two: enter the emailed code and a new password. */
export const ResetVerify: Story = {
    args: { methods: ["password"], initialView: "reset-verify", initialEmail: "you@example.com" },
}

/** Account creation view. */
export const SignUp: Story = { args: { methods: ["password"], initialView: "signup" } }

/** A failed redirect surfaced via initialError (e.g. expired magic link). */
export const WithError: Story = {
    args: {
        methods: ["email-code"],
        initialError: "Sign-in link failed: Email link is invalid or has expired",
    },
}

/** Rebranded: custom brand slot and copy, no kernel edits. */
export const CustomBrand: Story = {
    args: {
        methods: ["google", "email-code"],
        title: "Sign in to Lumen",
        subtitle: "Your workspace is waiting.",
        brand: (
            <span style={{ fontSize: 28 }} role="img" aria-label="Lumen">
                🌙
            </span>
        ),
    },
}
