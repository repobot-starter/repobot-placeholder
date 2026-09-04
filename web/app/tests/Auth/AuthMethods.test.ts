import { resolveAuthMethods } from "@base/core"
import { describe, expect, it } from "vitest"

// Parity contract: the iOS (AuthMethodsTests.swift) and Android
// (AuthMethodsTest.kt) ports assert these same cases, so the three platforms
// resolve an AUTH_METHODS value identically.
describe("resolveAuthMethods", () => {
    it("defaults to email-code when nothing is configured", () => {
        expect(resolveAuthMethods({})).toEqual(["email-code"])
        expect(resolveAuthMethods({ methodsValue: "" })).toEqual(["email-code"])
        expect(resolveAuthMethods({ methodsValue: "  ,  " })).toEqual(["email-code"])
    })

    it("ignores unknown names and falls back when nothing valid remains", () => {
        expect(resolveAuthMethods({ methodsValue: "magic-beans, sms" })).toEqual(["email-code"])
        expect(resolveAuthMethods({ methodsValue: "magic-beans, password" })).toEqual(["password"])
    })

    it("resolves every registered provider key", () => {
        expect(
            resolveAuthMethods({
                methodsValue: "email-code,password,google,apple,github,facebook,discord,x,linkedin,anonymous",
            }),
        ).toEqual([
            "email-code",
            "password",
            "google",
            "apple",
            "github",
            "facebook",
            "discord",
            "x",
            "linkedin",
            "anonymous",
        ])
    })

    it("preserves configured order and dedupes", () => {
        expect(resolveAuthMethods({ methodsValue: "google, email-code, google" })).toEqual([
            "google",
            "email-code",
        ])
        expect(resolveAuthMethods({ methodsValue: "password,email-code,anonymous" })).toEqual([
            "password",
            "email-code",
            "anonymous",
        ])
        expect(resolveAuthMethods({ methodsValue: "apple, google, email-code" })).toEqual([
            "apple",
            "google",
            "email-code",
        ])
    })

    it("tolerates whitespace and case", () => {
        expect(resolveAuthMethods({ methodsValue: " Google , EMAIL-CODE " })).toEqual([
            "google",
            "email-code",
        ])
        expect(resolveAuthMethods({ methodsValue: " Apple " })).toEqual(["apple"])
    })

    it("appends google for the legacy flag without duplicating", () => {
        expect(resolveAuthMethods({ googleEnabled: true })).toEqual(["email-code", "google"])
        expect(resolveAuthMethods({ methodsValue: "google", googleEnabled: true })).toEqual(["google"])
    })
})
