import { describe, expect, it } from "vitest"
import {
    authRouteWithReturnTo,
    postAuthRouteFromSearch,
    postAuthRoutePath,
    routes,
} from "../../src/Config/Router"

describe("auth redirect routing", () => {
    it("encodes returnTo on auth entry links", () => {
        expect(authRouteWithReturnTo(routes.login.path, "/quickbooks?source=hero#connect")).toBe(
            "/login?returnTo=%2Fquickbooks%3Fsource%3Dhero%23connect",
        )
    })

    it("uses returnTo when it is a safe in-app path", () => {
        expect(postAuthRouteFromSearch("?returnTo=%2Fquickbooks%3Fsource%3Dhero%23connect")).toBe(
            "/quickbooks?source=hero#connect",
        )
    })

    it("falls back for unsafe or missing returnTo values", () => {
        expect(postAuthRouteFromSearch("")).toBe(postAuthRoutePath)
        expect(postAuthRouteFromSearch("?returnTo=https%3A%2F%2Fevil.example")).toBe(postAuthRoutePath)
        expect(postAuthRouteFromSearch("?returnTo=%2F%2Fevil.example")).toBe(postAuthRoutePath)
    })
})
