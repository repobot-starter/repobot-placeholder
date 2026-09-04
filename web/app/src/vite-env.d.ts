/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GRAPHQL_URL: string
    /** "disabled" = no auth backend: the login surface renders an honest notice. */
    readonly VITE_AUTH_MODE: "local" | "builtin" | "disabled"
    readonly VITE_APP_NAME?: string
    readonly VITE_AUTH_METHODS?: string
    readonly VITE_AUTH_GOOGLE_ENABLED?: string
    readonly VITE_LOCAL_AUTH_TOKEN?: string
    /** "true" = GraphQL resolves against in-memory fixtures (static previews). */
    readonly VITE_DEMO_MODE?: string
    /** VAPID public key for the Web Push subscribe flow; empty = push unavailable. */
    readonly VITE_VAPID_PUBLIC_KEY?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
