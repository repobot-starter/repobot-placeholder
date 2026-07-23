import { ApolloProvider } from "@apollo/client"
import { ErrorBoundary, UiThemeProvider } from "@ui"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { runtime } from "./Config/Runtime"
import "./Global.styles.css"
import "./fonts.css"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ApolloProvider client={runtime.apolloClient}>
            {/* Default mode comes from repobot.theme.json (`mode`). */}
            <UiThemeProvider>
                <BrowserRouter>
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                </BrowserRouter>
            </UiThemeProvider>
        </ApolloProvider>
    </StrictMode>,
)
