/**
 * Tiny router helpers: a typed route table plus path builders. Apps define
 * their table with `defineRoutes` and build concrete paths with `buildPath`.
 */
export interface RouteDefinition {
    path: string
}

export type RouteTable = Record<string, RouteDefinition>

export function defineRoutes<T extends RouteTable>(routes: T): T {
    return routes
}

export type RouteParams = Record<string, string>

/** Replaces ":param" segments, e.g. buildPath("/projects/:id", { id: "project_1" }). */
export function buildPath(path: string, params?: RouteParams): string {
    if (!params) {
        return path
    }
    return path.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
        const value = params[name]
        if (value === undefined) {
            throw new Error(`Missing route param "${name}" for path "${path}".`)
        }
        return encodeURIComponent(value)
    })
}
