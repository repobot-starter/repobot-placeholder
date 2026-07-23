/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GRAPHQL_URL: string
    readonly VITE_AUTH_MODE: "local" | "builtin"
    readonly VITE_APP_NAME?: string
    readonly VITE_AUTH_METHODS?: string
    readonly VITE_AUTH_GOOGLE_ENABLED?: string
    readonly VITE_LOCAL_AUTH_TOKEN?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
