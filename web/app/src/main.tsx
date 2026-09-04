import { ApolloProvider } from "@apollo/client"
import { ErrorBoundary, GlobalErrors, ToastProvider, UiThemeProvider } from "@ui"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { activePack } from "./Config/activePack"
import { runtime } from "./Config/Runtime"
import "./Global.styles.css"
import "./fonts.css"

// Identity stamp for embedding hosts: which kernel pack this document
// renders. The platform's preview bridge forwards it with its "painted"
// report, which is how a template-flip veil can end the moment the flipped
// template is verifiably on screen (instead of reloading to find out).
// Stamped before render so even the earliest paint report carries it.
document.documentElement.setAttribute("data-repobot-pack", activePack.key)

// Dev only: a document restored from the back/forward cache (the owner
// clicked an external link and came back) resumes with a React tree built
// from whatever module graph the dev server held BEFORE the navigation.
// If the server restarted or invalidated modules in between, later lazy
// imports mix fresh module instances into the restored tree — duplicate
// contexts, stale hot-update state, "useToast must be used inside a
// ToastProvider"-class crashes under a perfectly wrapped tree. Reload the
// restored document so it always runs one consistent graph. Production
// bundles are immutable, so bfcache restores are safe there and this whole
// block compiles away with import.meta.hot.
if (import.meta.hot) {
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            window.location.reload()
        }
    })
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ApolloProvider client={runtime.apolloClient}>
            {/* Default mode comes from repobot.theme.json (`mode`). */}
            <UiThemeProvider>
                {/* Global toasts for action outcomes — publish via useToast(). */}
                <ToastProvider>
                    {/* basename tracks Vite's base so preview builds mounted
                        under a subpath (e.g. /games/saas/) route correctly. */}
                    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
                        <ErrorBoundary>
                            <App />
                        </ErrorBoundary>
                    </BrowserRouter>
                    {/* The app's one error surface — publish via publishGlobalError().
                        Presentation follows repobot.theme.json (ui.errors.presentation). */}
                    <GlobalErrors />
                </ToastProvider>
            </UiThemeProvider>
        </ApolloProvider>
    </StrictMode>,
)
